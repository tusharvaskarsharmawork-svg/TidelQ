// src/pages/index.js — Redirect root to the static map dashboard
export async function getServerSideProps() {
  return {
    redirect: { destination: '/index.html', permanent: false },
  };
}

export default function Home() {
  return null;
}
