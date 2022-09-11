// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import parseFrontMatter from "front-matter";
import parseTerraform from "@evops/hcl-terraform-parser";

// Fetch contents of file
const fetchContents = async (url, type) => {
  const usernames = await fetch(url, {
    headers: {
      // Authorize with GitHub, just in case
      Authorization: `token ${process.env.GITHUB_TOKEN} `,
    },
  });

  if (type == "json") {
    let data = await usernames.json();
    return data;
  } else {
    let data = await usernames.text();
    return data;
  }
};

// Finds repos from Markdown links in text
// @example: "lorem ipsum [link](https://github.com/coder/coder) long text" -> ["coder/coder"]
const findRepositories = (text) => {
  const urlRegex = /((?<=\(https:\/\/github.com\/)[^\s]+?(?=\)))/g;
  return text.match(urlRegex);
};

// Gets default branch of repo
// @example: "repo/repo" -> "main"
const getRepoDetails = async (repo) => {
  const response = await fetchContents(
    `https://api.github.com/repos/${repo}`,
    "json"
  );
  return response;
};

// Finds Coder templates inside repositories, recursively
const findTemplates = async (repositories) => {
  let files = [];
  for (const repo of repositories) {
    const repoDetails = await getRepoDetails(repo);
    const defaultBranch = repoDetails.default_branch;
    let publisherDetails = {
      name: repoDetails.owner.login,
      avatar: repoDetails.owner.avatar_url,
      url: repoDetails.owner.url,
    };
    let type = publisherDetails.name == "coder" ? "official" : "community";

    const response = await fetchContents(
      `https://api.github.com/repos/${repo}/git/trees/${defaultBranch}?recursive=1`,
      "json"
    );

    // If the template is root-level
    if (response.tree.find((item) => item.path == "main.tf")) {
      files.push({
        slug: repo.split("/")[1],
        url: `https://github.com/${repo}`,
        path: `${repo}/${defaultBranch}`,
        type,
        publisherDetails,
      });
    } else {
      const templatesFound = response.tree.filter(
        (item) =>
          item.path.includes(".tf") &&
          // hides other Terraform stuff inside coder/coder
          !item.path.includes("provisioner/terraform")
      );
      for (const item of templatesFound) {
        const itemPath = item.path.split("/");

        // Ensures the proper folder is used for nested templates
        const slug = itemPath[itemPath.length - 2];
        const location = itemPath.slice(0, -1).join("/");
        const owner = itemPath[0];

        files.push({
          slug,
          url: `https://github.com/${repo}/tree/${defaultBranch}/${location}`,
          path: `${repo}/${defaultBranch}/${location}`,
          type,
          publisherDetails,
        });
      }
    }
  }
  return files;
};

// Fetch the template name, description, tags,
// providers

// TODO: also find resources used
const hydrateTemplate = async (template) => {
  // Find the name, tags, description from the README
  // if there is frontmatter
  const readmeRaw = await fetchContents(
    `https://raw.githubusercontent.com/${template.path}/README.md`
  );
  const readmeParsed = parseFrontMatter(readmeRaw);
  const frontmatter = readmeParsed.attributes;

  // Find providers in main.tf, except "coder"
  const mainTFRaw = await fetchContents(
    `https://raw.githubusercontent.com/${template.path}/main.tf`
  );
  const mainTFParsed = parseTerraform.parse(mainTFRaw);
  const providers = Object.keys(mainTFParsed.required_providers).filter(
    ([provider]) => provider != "coder"
  );

  return { ...template, ...frontmatter, providers };
};

const hydrateTemplates = async (templatesList) => {
  let hydratedTemplates = [];
  for (const template of templatesList) {
    const hydrated = await hydrateTemplate(template);
    hydratedTemplates.push(hydrated);
  }
  return hydratedTemplates;
};

const handler = async (req, res) => {
  // Get list of repos from community-tempates.md
  const communityTemplatesFile = await fetchContents(
    "https://raw.githubusercontent.com/coder/coder/main/examples/templates/community-templates.md"
  );
  let repositories = findRepositories(communityTemplatesFile);

  // Add some other repositories :)
  repositories.push("bpmct/coder-templates");
  repositories.push("coder/coder");
  repositories.push("kotx/coder");

  // Recursively find Coder templates in each repository
  const templates = await findTemplates(repositories);

  const hydratedTemplates = await hydrateTemplates(templates);

  res.status(200).json(hydratedTemplates);
};

export default handler;
