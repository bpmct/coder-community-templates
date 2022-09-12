import Head from "next/head";
import Image from "next/image";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";

import Link from "next/link";

import { Link as MaterialLink } from "@mui/material";

import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { getCommunityTemplates } from "../utils";

export async function getStaticProps(context) {
  const templates = await getCommunityTemplates();

  return {
    props: {
      templates,
    },
    revalidate: 300,
  };
}

export default function Home({ templates }) {
  return (
    <div>
      <Head>
        <title>Coder Community Templates</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container maxWidth="lg">
        <h1>Coder Templates</h1>

        <p>
          Generated from{" "}
          <a
            href="https://github.com/coder/coder/blob/main/examples/templates/community-templates.md"
            target="_blank"
            rel="noreferrer"
          >
            <code>community-templates.md</code>
          </a>
        </p>

        <Grid
          container
          spacing={2}
          columns={{ xs: 4, md: 12 }}
          alignItems="stretch"
          alignContent="stretch"
        >
          {templates &&
            templates.map((template) => {
              return (
                <Grid item xs={2} md={4} key={template.path}>
                  <Card
                    variant="outlined"
                    style={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          avatar={
                            <Avatar
                              alt={template.publisherDetails.name}
                              src={template.publisherDetails.avatar}
                            />
                          }
                          label={template.publisherDetails.name}
                        />
                      </Stack>
                      <Typography variant="h5" component="div">
                        {template.slug}
                      </Typography>
                      <Typography sx={{ mb: 1.5 }} color="text.secondary">
                        {template.type == "community"
                          ? "Community template"
                          : "Official template"}
                      </Typography>
                      <Typography variant="body2">
                        {template.description}
                      </Typography>
                    </CardContent>
                    <CardActions style={{ marginTop: "auto" }}>
                      <Link
                        href={`/templates/${template.publisherDetails.name}/${template.slug}`}
                      >
                        <Button size="small">Use template</Button>
                      </Link>
                      <Button
                        href={template.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                      >
                        GitHub
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
        </Grid>
      </Container>

      <footer>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <span>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
}
