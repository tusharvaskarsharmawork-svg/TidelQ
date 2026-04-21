// src/pages/index.js — Redirect root to the landing page (landing.html)
export async function getServerSideProps() {
  return {
    redirect: { destination: '/landing.html', permanent: false },
  };
}

export default function Home() {
  return null;
}
