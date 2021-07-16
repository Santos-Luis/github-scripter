import { Octokit } from "@octokit/rest";

const auth = 'YOUR_TOKEN';
const octokit = new Octokit({ auth });

const owner = 'Santos-luis';
const repo = 'github-scripter';
const labelName = 'dependencies';

const primaryBranch = 'refs/heads/main';
const newBranch = 'refs/heads/dependabot-master';

// get branches references
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

// create the new branch (dependabot-master)
await octokit.request(
    'POST /repos/:owner/:repo/git/refs', 
    {
        repo,
        owner,
        ref: newBranch,
        sha,
    }
);

// get all open PRs that have the 'notification' label
const pullsSearch = await octokit.request('GET /search/issues', {
    q: `is:pr+
        state:open+
        label:${labelName}+
        repo:${owner}/${repo}
    `,
})

const pullsWithLable = pullsSearch.data.items;

pullsWithLable.forEach(async ({ number }) => {
    
    // update the base branch to the new one 
    await octokit.pulls.update({
        owner,
        repo,
        pull_number: number,
        base: 'dependabot-master',
    });

    // rebase, in case something is merged
    await octokit.pulls.updateBranch({
        owner,
        repo,
        pull_number: number,
    });

    // merge to the dependabot-master branch
    await octokit.pulls.merge({
        owner,
        repo,
        pull_number: number,
    });
});

// create a new PR to the dependabot-master branch
await octokit.pulls.create({
    owner,
    repo,
    head: newBranch,
    base: 'main',
    title: 'Dependabot pull request'
});
