import Head from "next/head";
import Image from "next/image";

import { useState } from "react";

import Container from "@mui/material/Container";
import { TextField } from "@mui/material";
import Link from "next/link";

import { getCommunityTemplates } from "../../../utils";

export async function getStaticPaths() {
  const templates = await getCommunityTemplates();

  return {
    paths: templates.map((template) => ({
      params: {
        username: template.publisherDetails.name,
        slug: template.slug,
      },
    })),
    fallback: false, // can also be true or 'blocking'
  };
}

export async function getStaticProps(context) {
  const templates = await getCommunityTemplates();

  const { username, slug } = context.params;

  const templateDetails = templates.find(
    (template) =>
      username == template.publisherDetails.name && slug == template.slug
  );

  return {
    props: {
      templateDetails,
    },
    revalidate: 600,
  };
}

export default function Home({ templateDetails }) {
  return (
    <div>
      <Head>
        <title>Coder Community Templates</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container maxWidth="lg">
        <h1>
          {templateDetails.publisherDetails.name}/{templateDetails.slug}
        </h1>
        {templateDetails.description ? (
          <p>{templateDetails.description}</p>
        ) : null}
        <a href={templateDetails.url} target="_blank" rel="noreferrer">
          <code>View on GitHub</code>
        </a>
        <h2>Providers used</h2>
        {templateDetails.providers.map((provider, i) => {
          return <li key={i}>{provider}</li>;
        })}

        <h2>Add this template</h2>

        <p>Coder templates are meant to be adapted/modified:</p>

        <TextField
          id="outlined-multiline-static"
          label="shell"
          multiline
          rows={8}
          style={{ minWidth: "50%" }}
          value={templateDetails.command}
          onFocus={(event) => {
            event.target.select();
          }}
          readOnly
        />

        <footer style={{ marginTop: "30px" }}>
          <Link href="/">
            <a>Go back</a>
          </Link>
        </footer>
      </Container>
    </div>
  );
}
