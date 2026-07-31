import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { AvatarItem, UserInventoryData } from '../types/avatar.types';

export function useAvatarRealtime(uid?: string) {
  const [items, setItems] = useState<AvatarItem[]>([]);
  const [inventory, setInventory] = useState<UserInventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Realtime listener for avatar items
    const q = query(collection(db, 'avatarItems'), orderBy('createdAt', 'desc'));
    const unsubscribeItems = onSnapshot(q, (snapshot) => {
      const fetchedItems: AvatarItem[] = [];
      snapshot.forEach((docSnap) => {
        fetchedItems.push({ id: docSnap.id, ...docSnap.data() } as AvatarItem);
      });
      setItems(fetchedItems);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching avatar items realtime:', err);
      setError(err.message);
      setLoading(false);
    });

    let unsubscribeInventory = () => {};
    if (uid) {
      const invRef = doc(db, 'userInventory', uid);
      unsubscribeInventory = onSnapshot(invRef, (docSnap) => {
        if (docSnap.exists()) {
          setInventory({ uid, ...docSnap.data() } as UserInventoryData);
        } else {
          setInventory({ uid, ownedItems: [], equippedItems: [], coinsSpent: 0, premiumItems: [] });
        }
      }, (err) => {
        console.error('Error fetching user inventory realtime:', err);
      });
    }

    return () => {
      unsubscribeItems();
      unsubscribeInventory();
    };
  }, [uid]);

  return { items, inventory, loading, error };
}
