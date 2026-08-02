import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Pass onOpenSupport to AfrigomboTab
    content = content.replace(
        "supportConvo={supportConvo}\n                setActiveConvo={setActiveConvo}",
        "supportConvo={supportConvo}\n                setActiveConvo={setActiveConvo}\n                onOpenSupport={handleOpenSupport}"
    )

    # Update handleOpenSupport logic to create convo
    old_handle = """const handleOpenSupport = () => {
    setActiveConvo({
      id: currentUser.uid,
      type: "support",
      participants: [currentUser.uid, "afrigombo_support"],
      userName: "Équipe AFRIGOMBO",
      userPhoto: "/logo.png",
      ...supportConvo
    });
    if (supportConvo?.unreadCount?.[currentUser?.uid] > 0) {
      try {
        const convoRef = doc(db, "supportConversations", currentUser.uid);
        updateDoc(convoRef, { [`unreadCount.${currentUser.uid}`]: 0 });
      } catch (err) {}
    }
  };"""

    new_handle = """const handleOpenSupport = async () => {
    try {
      await SupportService.getOrCreateSupportConversation(currentUser.uid, currentProfile);
    } catch (e) {
      console.warn("Could not ensure support conversation:", e);
    }
    setActiveConvo({
      id: currentUser.uid,
      type: "support",
      participants: [currentUser.uid, "afrigombo_support"],
      userName: "Équipe AFRIGOMBO",
      userPhoto: "/logo.png",
      ...supportConvo
    });
    if (supportConvo?.unreadCount?.[currentUser?.uid] > 0) {
      try {
        const convoRef = doc(db, "supportConversations", currentUser.uid);
        updateDoc(convoRef, { [`unreadCount.${currentUser.uid}`]: 0 });
      } catch (err) {}
    }
  };"""
    content = content.replace(old_handle, new_handle)

    with open(filename, 'w') as f:
        f.write(content)

fix_file('src/components/MessagesView.tsx')
