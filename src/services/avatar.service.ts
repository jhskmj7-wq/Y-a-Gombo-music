import { db, storage } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDoc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { AvatarItem, AvatarConfig } from '../types/avatar.types';

export const avatarService = {
  async createAvatarItem(itemData: Omit<AvatarItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const itemsRef = collection(db, 'avatarItems');
    const newDocRef = doc(itemsRef);
    const id = newDocRef.id;
    
    await setDoc(newDocRef, {
      ...itemData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: itemData.isActive ?? true
    });
    
    return id;
  },

  async updateAvatarItem(id: string, updates: Partial<AvatarItem>): Promise<void> {
    const itemRef = doc(db, 'avatarItems', id);
    await updateDoc(itemRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  async archiveAvatarItem(id: string, archive: boolean = true): Promise<void> {
    const itemRef = doc(db, 'avatarItems', id);
    await updateDoc(itemRef, {
      isActive: !archive,
      updatedAt: new Date().toISOString()
    });
  },

  async publishAvatarItem(id: string): Promise<void> {
    const itemRef = doc(db, 'avatarItems', id);
    await updateDoc(itemRef, {
      isActive: true,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteAvatarItem(id: string): Promise<void> {
    const itemRef = doc(db, 'avatarItems', id);
    await deleteDoc(itemRef);
  },

  async updateAvatar(uid: string, config: AvatarConfig, avatarImage?: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const updates: any = {
      avatarConfig: config,
      avatarUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (avatarImage) {
      updates.avatarImage = avatarImage;
    }
    await updateDoc(userRef, updates);

    // Also update userAvatars collection in realtime sync
    const userAvatarRef = doc(db, 'userAvatars', uid);
    await setDoc(userAvatarRef, {
      uid,
      config,
      avatarImage: avatarImage || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  },

  async equipAvatar(uid: string, itemId: string, category: string): Promise<void> {
    const inventoryRef = doc(db, 'userInventory', uid);
    const snap = await getDoc(inventoryRef);
    let equipped: string[] = [];
    if (snap.exists()) {
      equipped = snap.data().equippedItems || [];
    }
    // Update or toggle equipped
    if (!equipped.includes(itemId)) {
      equipped.push(itemId);
    } else {
      equipped = equipped.filter(id => id !== itemId);
    }

    await setDoc(inventoryRef, {
      uid,
      equippedItems: equipped,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  },

  async buyAvatarItem(uid: string, item: AvatarItem, userCoins: number): Promise<{ success: boolean; error?: string }> {
    if (userCoins < item.price) {
      return { success: false, error: 'Solde insuffisant' };
    }

    const inventoryRef = doc(db, 'userInventory', uid);
    const invSnap = await getDoc(inventoryRef);
    let owned: string[] = [];
    if (invSnap.exists()) {
      owned = invSnap.data().ownedItems || [];
    }

    if (owned.includes(item.id)) {
      return { success: false, error: 'Article déjà possédé' };
    }

    owned.push(item.id);

    await setDoc(inventoryRef, {
      uid,
      ownedItems: owned,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Record purchase
    const purchaseRef = collection(db, 'avatarPurchases');
    await addDoc(purchaseRef, {
      userId: uid,
      itemId: item.id,
      itemName: item.name,
      price: item.price,
      purchasedAt: new Date().toISOString()
    });

    // Deduct coins from user balance
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      'wallet.coins': userCoins - item.price,
      updatedAt: new Date().toISOString()
    });

    return { success: true };
  },

  async uploadAvatarAsset(file: File, pathPrefix: string = 'avatar_assets'): Promise<string> {
    const storageRef = ref(storage, `${pathPrefix}/${Date.now()}_${file.name}`);
    const uploadTask = await uploadBytesResumable(storageRef, file);
    const downloadUrl = await getDownloadURL(uploadTask.ref);
    return downloadUrl;
  }
};
