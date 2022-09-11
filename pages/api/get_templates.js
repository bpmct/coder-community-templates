// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

// Finds Markdown links in text
// "lorem ipsum [link](https://github.com/coder/coder) long text" -> ["coder/coder"]
const findRepositories = (text) => {
    const urlRegex = /((?<=\(https:\/\/github.com\/)[^\s]+?(?=\)))/g;
    return text.match(urlRegex);
};

const getDefaultBranch = async (repo) => {
    const request = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN} `,
        },
    });
    const response = await request.json();
    return response.default_branch;
};

const findStructure = async (repositories) => {
    let files = [];

    for (const repo of repositories) {
        const defaultBranch = await getDefaultBranch(repo);

        const request = await fetch(
            `https://api.github.com/repos/${repo}/git/trees/${defaultBranch}?recursive=1`,
            {
                headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN} `,
                },
            }
        );
        const response = await request.json();

        // // If the template is root-level
        if (response.tree.find((item) => item.path == "main.tf")) {
            files.push({
                name: repo.split("/")[1],
                location: `https://github.com/${repo}`,
            });
        } else {
            const templatesFound = response.tree.filter(
                (item) =>
                    item.path.includes(".tf") &&
                    !item.path.includes("provisioner/terraform")
            );
            for (const item of templatesFound) {
                const itemPath = item.path.split("/");

                // This "should" work for nested templates as well.
                const name = itemPath[itemPath.length - 2];
                const location = itemPath.slice(0, -1).join("/");

                files.push({
                    name,
                    location: `https://github.com/${repo}/tree/${defaultBranch}/${location}`,
                });
            }
        }
    }

    return files;
};

const handler = async (req, res) => {
    // get community repos
    const usernames = await fetch(
        "https://raw.githubusercontent.com/coder/coder/main/examples/templates/community-templates.md"
    );
    const data = await usernames.text();
    let projects = findRepositories(data);

    // add some other templates :)
    projects.push("bpmct/coder-templates");
    projects.push("coder/coder");
    projects.push("kotx/coder");

    // get files for each repo
    const structure = await findStructure(projects);

    res.status(200).json(structure);
};

export default handler;
