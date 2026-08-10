import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";

const NotFound = () => (
  <AppShell>
    <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center text-center">
      <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">Signal not found</div>
      <h1 className="text-5xl font-bold tracking-tight text-white">404</h1>
      <p className="mt-4 text-sm leading-6 text-slate-400">This workspace route does not exist. Return to the operations overview to continue.</p>
      <Link to="/" className="mt-7 rounded-lg bg-cyan-300 px-4 py-2.5 text-xs font-bold text-[#06111e] transition hover:bg-cyan-200">Return to overview</Link>
    </div>
  </AppShell>
);

export default NotFound;
