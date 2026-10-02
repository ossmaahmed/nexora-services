import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-5xl font-extrabold text-transparent md:text-7xl">
        NEXORA
      </h1>
      <p className="mt-4 max-w-xl text-lg text-slate-400">
        IT Service Management Platform. Request cloud, Kubernetes and database services and track them from Pending to Completed.
      </p>
      <Link to="/login" className="btn mt-8 px-8 py-3 text-base">Get Started</Link>
    </div>
  );
}
