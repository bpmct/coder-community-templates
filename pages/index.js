import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import useSWR from "swr";

export async function getServerSideProps(context) {
  const res = await fetch(`${process.env.ACCESS_URL}/api/get_templates`);
  const data = await res.json();

  return {
    props: {
      templates: data,
    }, // will be passed to the page component as props
  };
}

export default function Home({ templates }) {
  return (
      <div className={styles.container}>
        <Head>
          <title>Create Next App</title>
          <meta name="description" content="Generated by create next app" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className={styles.main}>
          <h1 className={styles.title}>Coder Templates</h1>

          <p className={styles.description}>
            Generated from{" "}
            <a
                href="https://github.com/coder/coder/blob/main/examples/templates/community-templates.md"
                target="_blank"
                rel="noreferrer"
            >
              <code className={styles.code}>community-templates.md</code>
            </a>
          </p>

          <div className={styles.grid}>
            {templates &&
                templates.map((template) => {
                  return (
                      <a
                          href={template.location}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.card}
                      >
                        <h2>{template.name}</h2>
                        <p>
                          {template.location.includes("coder/coder")
                              ? "Official example"
                              : "Community template"}
                        </p>
                      </a>
                  );
                })}
          </div>
        </main>

        <footer className={styles.footer}>
          <a
              href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
          >
            Powered by{" "}
            <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
          </a>
        </footer>
      </div>
  );
}
