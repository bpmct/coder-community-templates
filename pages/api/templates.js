// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {
  fetchContents,
  findRepositories,
  findTemplates,
  hydrateTemplates,
} from "../../utils/index";

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
  repositories.push("sharkymark/v2-templates");

  // Recursively find Coder templates in each repository
  const templates = await findTemplates(repositories);

  const hydratedTemplates = await hydrateTemplates(templates);

  res.status(200).json(hydratedTemplates);
};

export default handler;
