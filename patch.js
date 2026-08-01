const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  'const { loading: authLoading } = useAuth();',
  `const { loading: authLoading, currentUser } = useAuth();
  const [platformStatus, setPlatformStatus] = useState<any>(null);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "platform"), (snap) => {
      if (snap.exists()) setPlatformStatus(snap.data());
    });
    return () => unsub();
  }, []);`
);
fs.writeFileSync('src/App.tsx', code);
