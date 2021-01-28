import { Octokit } from "@octokit/rest";

const auth = 'YOUR_TOKEN';
const octokit = new Octokit({ auth });

const owner = 'Santos-luis';
const repo = 'github-scripter';
const labelName = 'dependencies';

const primaryBranch = 'refs/heads/main';
const newBranch = 'refs/heads/dependabot-master';

const getRefs = await octokit.request(
    'GET /repos/:owner/:repo/git/refs/head',
    {
        repo,
        owner,
    }
);

const mainBranch = getRefs.data.find(({ ref }) => (
    ref === primaryBranch
));

const sha = mainBranch.object.sha;

await octokit.request(
    'POST /repos/:owner/:repo/git/refs', 
    {
        repo,
        owner,
        ref: newBranch,
        sha,
    }
);

const pullsSearch = await octokit.request('GET /search/issues', {
    q: `is:pr+
        state:open+
        label:${labelName}+
        repo:${owner}/${repo}
    `,
})

const pullsWithLable = pullsSearch.data.items;

pullsWithLable.forEach(async ({ number }) => {
    await octokit.pulls.update({
        owner,
        repo,
        pull_number: number,
        base: 'dependabot-master',
    });

    await octokit.pulls.updateBranch({
        owner,
        repo,
        pull_number: number,
    });

    await octokit.pulls.merge({
        owner,
        repo,
        pull_number: number,
    });
});

await octokit.pulls.create({
    owner,
    repo,
    head: newBranch,
    base: 'main',
    title: 'Dependabot pull request'
});
