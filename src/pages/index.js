// src/pages/index.js — Redirect root to the landing page (index.html)
export async function getServerSideProps() {
  return {
    redirect: { destination: '/index.html', permanent: false },
  };
}

export default function Home() {
  return null;
}
