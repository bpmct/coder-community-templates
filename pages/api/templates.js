// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getCommunityTemplates } from "../../utils/index";

const handler = async (req, res) => {
  const templates = await getCommunityTemplates();
  res.status(200).json(templates);
};

export default handler;
