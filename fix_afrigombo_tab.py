import re

def fix_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Update interface
    content = content.replace(
        "setActiveConvo: (convo: any) => void;",
        "setActiveConvo: (convo: any) => void;\n  onOpenSupport: () => void;"
    )

    # Update component args
    content = content.replace(
        "setActiveConvo\n}: AfrigomboTabProps",
        "setActiveConvo,\n  onOpenSupport\n}: AfrigomboTabProps"
    )

    # Update button onClick
    # Need to match the onClick block
    old_onclick = """onClick={() => {
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
            }}"""
    
    new_onclick = """onClick={() => {
              onOpenSupport();
            }}"""
            
    content = content.replace(old_onclick, new_onclick)

    with open(filename, 'w') as f:
        f.write(content)

fix_file('src/components/messages/AfrigomboTab.tsx')
