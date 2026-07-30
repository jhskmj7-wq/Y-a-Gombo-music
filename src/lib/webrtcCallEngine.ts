import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  deleteDoc
} from "firebase/firestore";

export interface CallSession {
  id?: string;
  callerUid: string;
  callerName: string;
  callerPhoto?: string;
  receiverUid: string;
  receiverName: string;
  receiverPhoto?: string;
  type: "audio" | "video";
  status: "offered" | "accepted" | "rejected" | "ended" | "busy";
  offer?: any;
  answer?: any;
  createdAt: string;
  endedAt?: string;
  durationSeconds?: number;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ]
};

export class WebRTCCallService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentCallId: string | null = null;
  private unsubCallDoc: (() => void) | null = null;
  private unsubCandidates: (() => void) | null = null;

  /**
   * Listen to incoming calls for current user
   */
  public static listenIncomingCalls(
    currentUserUid: string,
    onCallReceived: (call: CallSession) => void
  ) {
    if (!currentUserUid || !db) return () => {};

    const q = query(
      collection(db, "calls"),
      where("receiverUid", "==", currentUserUid),
      where("status", "==", "offered")
    );

    return onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          onCallReceived({ id: change.doc.id, ...data } as CallSession);
        }
      });
    });
  }

  /**
   * Start an outgoing call (Audio or Video)
   */
  public async initiateCall(
    params: {
      callerUid: string;
      callerName: string;
      callerPhoto?: string;
      receiverUid: string;
      receiverName: string;
      receiverPhoto?: string;
      type: "audio" | "video";
    },
    callbacks: {
      onLocalStream?: (stream: MediaStream) => void;
      onRemoteStream?: (stream: MediaStream) => void;
      onStatusChange?: (status: string) => void;
      onError?: (err: any) => void;
    }
  ): Promise<string> {
    try {
      this.pc = new RTCPeerConnection(ICE_SERVERS);
      this.remoteStream = new MediaStream();

      // Get local audio/video media
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: params.type === "video" ? { facingMode: "user" } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (callbacks.onLocalStream) callbacks.onLocalStream(this.localStream);

      // Add local tracks to PeerConnection
      this.localStream.getTracks().forEach((track) => {
        if (this.pc && this.localStream) {
          this.pc.addTrack(track, this.localStream);
        }
      });

      // Listen for remote tracks
      this.pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          this.remoteStream?.addTrack(track);
        });
        if (callbacks.onRemoteStream && this.remoteStream) {
          callbacks.onRemoteStream(this.remoteStream);
        }
      };

      // Create call document in Firestore
      const callDocRef = doc(collection(db, "calls"));
      this.currentCallId = callDocRef.id;

      const callData: CallSession = {
        id: this.currentCallId,
        callerUid: params.callerUid,
        callerName: params.callerName,
        callerPhoto: params.callerPhoto || "",
        receiverUid: params.receiverUid,
        receiverName: params.receiverName,
        receiverPhoto: params.receiverPhoto || "",
        type: params.type,
        status: "offered",
        createdAt: new Date().toISOString()
      };

      // Collect ICE candidates and save to subcollection
      const callerCandidatesCol = collection(db, "calls", this.currentCallId, "callerCandidates");
      this.pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(callerCandidatesCol, event.candidate.toJSON());
        }
      };

      // Create WebRTC Offer SDP
      const offerDescription = await this.pc.createOffer();
      await this.pc.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type
      };

      await setDoc(callDocRef, { ...callData, offer });

      // Listen for answer or status update from receiver
      this.unsubCallDoc = onSnapshot(callDocRef, async (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        if (callbacks.onStatusChange) {
          callbacks.onStatusChange(data.status);
        }

        if (this.pc && !this.pc.currentRemoteDescription && data.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          await this.pc.setRemoteDescription(answerDescription);
        }

        if (data.status === "rejected" || data.status === "ended") {
          this.cleanup();
        }
      });

      // Listen for receiver ICE candidates
      const receiverCandidatesCol = collection(db, "calls", this.currentCallId, "receiverCandidates");
      this.unsubCandidates = onSnapshot(receiverCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const candidate = new RTCIceCandidate(change.doc.data());
            this.pc?.addIceCandidate(candidate);
          }
        });
      });

      return this.currentCallId;
    } catch (err) {
      if (callbacks.onError) callbacks.onError(err);
      this.cleanup();
      throw err;
    }
  }

  /**
   * Accept an incoming call
   */
  public async answerCall(
    callId: string,
    callbacks: {
      onLocalStream?: (stream: MediaStream) => void;
      onRemoteStream?: (stream: MediaStream) => void;
      onStatusChange?: (status: string) => void;
      onError?: (err: any) => void;
    }
  ) {
    try {
      this.currentCallId = callId;
      const callDocRef = doc(db, "calls", callId);
      const callSnap = await getDoc(callDocRef);
      if (!callSnap.exists()) throw new Error("Appel introuvable");

      const callData = callSnap.data() as CallSession;

      this.pc = new RTCPeerConnection(ICE_SERVERS);
      this.remoteStream = new MediaStream();

      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callData.type === "video" ? { facingMode: "user" } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (callbacks.onLocalStream) callbacks.onLocalStream(this.localStream);

      this.localStream.getTracks().forEach((track) => {
        if (this.pc && this.localStream) {
          this.pc.addTrack(track, this.localStream);
        }
      });

      this.pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          this.remoteStream?.addTrack(track);
        });
        if (callbacks.onRemoteStream && this.remoteStream) {
          callbacks.onRemoteStream(this.remoteStream);
        }
      };

      const receiverCandidatesCol = collection(db, "calls", callId, "receiverCandidates");
      this.pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(receiverCandidatesCol, event.candidate.toJSON());
        }
      };

      // Set Remote Offer
      const offer = callData.offer;
      await this.pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Create Answer SDP
      const answerDescription = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp
      };

      await updateDoc(callDocRef, {
        answer,
        status: "accepted"
      });

      // Listen for caller ICE candidates
      const callerCandidatesCol = collection(db, "calls", callId, "callerCandidates");
      this.unsubCandidates = onSnapshot(callerCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const candidate = new RTCIceCandidate(change.doc.data());
            this.pc?.addIceCandidate(candidate);
          }
        });
      });

      // Listen for call status
      this.unsubCallDoc = onSnapshot(callDocRef, (snapshot) => {
        const data = snapshot.data();
        if (data && callbacks.onStatusChange) {
          callbacks.onStatusChange(data.status);
        }
        if (data && (data.status === "ended" || data.status === "rejected")) {
          this.cleanup();
        }
      });
    } catch (err) {
      if (callbacks.onError) callbacks.onError(err);
      this.cleanup();
      throw err;
    }
  }

  /**
   * Reject an incoming call
   */
  public async rejectCall(callId: string) {
    if (!callId || !db) return;
    try {
      const callDocRef = doc(db, "calls", callId);
      await updateDoc(callDocRef, { status: "rejected", endedAt: new Date().toISOString() });
      this.logCallEnd(callId, "rejected", 0);
    } catch (e) {
      console.warn("Error rejecting call:", e);
    }
    this.cleanup();
  }

  /**
   * End an active call
   */
  public async endCall() {
    if (this.currentCallId && db) {
      try {
        const callDocRef = doc(db, "calls", this.currentCallId);
        await updateDoc(callDocRef, { status: "ended", endedAt: new Date().toISOString() });
        this.logCallEnd(this.currentCallId, "ended", 0);
      } catch (e) {
        console.warn("Error ending call:", e);
      }
    }
    this.cleanup();
  }

  /**
   * Log call summary to callLogs collection
   */
  private async logCallEnd(callId: string, status: string, duration: number) {
    try {
      const snap = await getDoc(doc(db, "calls", callId));
      if (snap.exists()) {
        const data = snap.data();
        await addDoc(collection(db, "callLogs"), {
          callId,
          callerUid: data.callerUid,
          callerName: data.callerName,
          receiverUid: data.receiverUid,
          receiverName: data.receiverName,
          type: data.type,
          status,
          createdAt: data.createdAt || new Date().toISOString(),
          endedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn("Could not log call:", e);
    }
  }

  /**
   * Toggle Audio Mute
   */
  public toggleMute(): boolean {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        return !audioTracks[0].enabled; // returns isMuted
      }
    }
    return false;
  }

  /**
   * Toggle Video Camera
   */
  public toggleVideo(): boolean {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        return !videoTracks[0].enabled; // returns isVideoOff
      }
    }
    return false;
  }

  /**
   * Switch Camera (Front / Rear)
   */
  public async switchCamera(): Promise<MediaStream | null> {
    if (!this.localStream) return null;
    try {
      const currentVideoTrack = this.localStream.getVideoTracks()[0];
      if (!currentVideoTrack) return null;

      const currentConstraints = currentVideoTrack.getConstraints();
      const newFacingMode = currentConstraints.facingMode === "user" ? "environment" : "user";

      currentVideoTrack.stop();
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: true
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (this.pc && newVideoTrack) {
        const senders = this.pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender) {
          videoSender.replaceTrack(newVideoTrack);
        }
      }

      this.localStream = newStream;
      return this.localStream;
    } catch (e) {
      console.warn("Could not switch camera:", e);
      return null;
    }
  }

  /**
   * Cleanup media streams and WebRTC connection
   */
  public cleanup() {
    if (this.unsubCallDoc) {
      this.unsubCallDoc();
      this.unsubCallDoc = null;
    }
    if (this.unsubCandidates) {
      this.unsubCandidates();
      this.unsubCandidates = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((t) => t.stop());
      this.remoteStream = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.currentCallId = null;
  }
}
