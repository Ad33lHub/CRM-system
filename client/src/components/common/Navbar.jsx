import useAuth from '../../hooks/useAuth.js';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <span className="text-lg font-semibold">Software House CRM</span>
      <div className="flex items-center gap-3">
        {user ? <span className="text-sm text-muted-foreground">{user.name}</span> : null}
        <button type="button" onClick={logout} className="text-sm text-blue-600 hover:underline">
          Logout
        </button>
      </div>
    </header>
  );
}
