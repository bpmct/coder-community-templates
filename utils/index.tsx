import parseFrontMatter from "front-matter";
import parseTerraform from "@evops/hcl-terraform-parser";

interface TemplatePath {

}

interface TemplateDetails extends TemplatePath {

}

// Fetch contents of file
export const fetchContents = async (url: string, type?: string) => {
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
export const findRepositories = (text: string): string[] => {
  const urlRegex = /((?<=\(https:\/\/github.com\/)[^\s]+?(?=\)))/g;
  return text.match(urlRegex);;
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
export const findTemplates = async (repositories) => {
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
        repo: repo.split("/")[1],
        type,
        publisherDetails,
      });
    } else {
      const templatesFound = response.tree.filter(
        (item) =>
          item.path.includes("main.tf") &&
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
          repo: repo.split("/")[1],
          location: location,
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
  const frontmatter:{} = readmeParsed.attributes;

  // Find providers in main.tf, except "coder"
  const mainTFRaw = await fetchContents(
    `https://raw.githubusercontent.com/${template.path}/main.tf`
  );
  const mainTFParsed = parseTerraform.parse(mainTFRaw);
  const providers = Object.keys(mainTFParsed.required_providers).filter(
    (provider) => provider != "coder"
  );

  // Generate command to use template
  let command = `git clone https://github.com/${template.publisherDetails.name}/${template.repo}\ncd ${template.repo}`;
  if (template.location) {
    command += `/${template.location}`;
  }
  command += "\ncoder templates create";

  return { ...template, ...frontmatter, command, providers };
};
export const hydrateTemplates = async (templatesList) => {
  let hydratedTemplates = [];
  for (const template of templatesList) {
    const hydrated = await hydrateTemplate(template);
    hydratedTemplates.push(hydrated);
  }
  return hydratedTemplates;
};

export const getCommunityTemplates = async () => {
  // Get list of repos from community-tempates.md
  const communityTemplatesFile = await fetchContents(
    "https://raw.githubusercontent.com/coder/coder/main/examples/templates/community-templates.md"
  );

  let repositories: string[] = findRepositories(communityTemplatesFile);

  // Add some other repositories :)
  repositories.push("bpmct/coder-templates");
  repositories.push("coder/coder");
  repositories.push("kotx/coder");
  repositories.push("sharkymark/v2-templates");

  // Recursively find Coder templates in each repository
  const templates = await findTemplates(repositories);

  const hydratedTemplates = await hydrateTemplates(templates);

  return hydratedTemplates;
};
