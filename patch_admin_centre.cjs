const fs = require('fs');
let code = fs.readFileSync('src/components/AdminCentre.tsx', 'utf8');

const regex = /const unsubscribeUser = gomboDB\.listenUserNotifications\(currentUser\.uid, \(userNotifs\) => \{[\s\S]*?return userNotifs;\s*\}\);\s*\}\);/;

const replacement = `let isFirstLoadUser = true;
      const unsubscribeUser = gomboDB.listenUserNotifications(currentUser.uid, (userNotifs) => {
        setRealNotifications(prev => {
          const newUnread = userNotifs.filter(n => !n.read && !n.isRead).length;
          const oldUnread = prev.filter(n => !n.read && !n.isRead).length;
          if (!isFirstLoadUser && newUnread > oldUnread) {
            try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
            try { audioSynth.playValidationSuccess(); } catch (err) {}
          }
          isFirstLoadUser = false;
          return userNotifs;
        });
      });`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/AdminCentre.tsx', code);
