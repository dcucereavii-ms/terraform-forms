import { generateTfvars } from './generateTfvars.mjs';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

// Helper to resolve __dirname in ES modules
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

export const triggerPipeline = async (req, res) => {
  const { parameters, resourceType } = req.body; // resourceType passed separately, not in parameters
  console.log('Request body:', req.body);

  // Use environment variable for PAT
  const azureDevOpsPAT = process.env.AZURE_DEVOPS_PAT;
  const teamsWebhookUrl = process.env.TEAMS_WEBHOOK_URL;

  if (!azureDevOpsPAT) {
    return res.status(500).json({ message: 'Personal Access Token (PAT) is not set in environment variables.' });
  }

  // Repository ID and Project ID
  const repoId = 'd4273e58-2ba0-4a50-9699-00bb5116cb4f';
  const project = 'c9535ec7-d2e7-48cd-a59f-c3cfb8a44404';
  const apiVersion = '7.1-preview.1'; // API version

  const baseBranch = 'master'; // Base branch for PR
  const newBranch = `update-${Date.now()}`; // New branch name
  const targetBranch = 'master'; // Static target branch

  try {
    // Step 1: Generate the .tfvars file (resourceType used in filename, but NOT in parameters)
    const tfvarsFilename = `${resourceType}.tfvars`; // Dynamic filename based on resourceType
    const tfvarsPath = path.resolve(__dirname, 'terraform', tfvarsFilename);
    console.log('Computed TFVars path:', tfvarsPath);

    // Generate the tfvars content dynamically based on parameters, excluding resourceType
    await generateTfvars(parameters, tfvarsPath);
    console.log('TFVars file created successfully.');

    // Check if the TFVars file exists after creation
    if (!await fs.access(tfvarsPath).then(() => true).catch(() => false)) {
      throw new Error(`TFVars file not found at path: ${tfvarsPath}`);
    }

    const tfvarsContent = await fs.readFile(tfvarsPath, 'utf-8');
    console.log('TFVars content:', tfvarsContent);

    // Step 2: Fetch branches
    const getBranchesUrl = `https://dev.azure.com/dcucereavii/${project}/_apis/git/repositories/${repoId}/refs?api-version=${apiVersion}`;
    console.log('Fetching branches from URL:', getBranchesUrl);

    const getBranchesResponse = await fetch(getBranchesUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${azureDevOpsPAT}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!getBranchesResponse.ok) {
      const errorText = await getBranchesResponse.text();
      console.error('Fetch branches error:', errorText);
      throw new Error(`Failed to fetch branches. Status code: ${getBranchesResponse.status}`);
    }

    const getBranchesData = await getBranchesResponse.json();
    console.log('Get branches response data:', getBranchesData);

    // Check if the static target branch exists in the response
    const targetBranchRef = getBranchesData.value.find(ref => ref.name === `refs/heads/${targetBranch}`);
    if (!targetBranchRef) {
      console.error(`Target branch ${targetBranch} not found. Available branches:`, getBranchesData.value.map(ref => ref.name));
      throw new Error(`Target branch '${targetBranch}' not found.`);
    }

    const oldObjectId = targetBranchRef.objectId;
    if (!oldObjectId) {
      throw new Error('Could not retrieve the latest commit ID from the target branch');
    }

    // // Step 3: Create a new branch
    // const createBranchUrl = `https://dev.azure.com/dcucereavii/${project}/_apis/git/repositories/${repoId}/pushes?api-version=7.1-preview.2`;
    // const createBranchRequestBody = {
    //   refUpdates: [
    //     {
    //       name: `refs/heads/${newBranch}`,
    //       oldObjectId: oldObjectId // Use the commit ID from the target branch
    //     }
    //   ],
    //   commits: [
    //     {
    //       comment: `Adding ${resourceType}.tfvars file.`, // Use resourceType in the commit message
    //       changes: [
    //         {
    //           changeType: "add",
    //           item: {
    //             path: `/terraform/${tfvarsFilename}`
    //           },
    //           newContent: {
    //             content: tfvarsContent,
    //             contentType: "rawtext"
    //           }
    //         }
    //       ]
    //     }
    //   ]
    // };

    // console.log('Create branch request body:', JSON.stringify(createBranchRequestBody, null, 2));

    // const createBranchResponse = await fetch(createBranchUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Basic ${Buffer.from(`:${azureDevOpsPAT}`).toString('base64')}`
    //   },
    //   body: JSON.stringify(createBranchRequestBody)
    // });

    const createBranchUrl = `https://dev.azure.com/dcucereavii/${project}/_apis/git/repositories/${repoId}/pushes?api-version=7.1-preview.2`;

    const createBranchRequestBody = {
      refUpdates: [
        {
          name: `refs/heads/${newBranch}`,
          oldObjectId: '0000000000000000000000000000000000000000' // Create an empty branch
        }
      ],
      commits: [
        {
          comment: `Adding ${resourceType}.tfvars file.`, // Use resourceType in the commit message
          changes: [
            {
              changeType: "add",
              item: {
                path: `/terraform/${tfvarsFilename}` // Path to the terraform folder and tfvars file
              },
              newContent: {
                content: tfvarsContent, // Content of the tfvars file
                contentType: "rawtext"
              }
            }
          ]
        }
      ]
    };

    console.log('Create branch request body:', JSON.stringify(createBranchRequestBody, null, 2));

    const createBranchResponse = await fetch(createBranchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`:${azureDevOpsPAT}`).toString('base64')}`
      },
      body: JSON.stringify(createBranchRequestBody)
    });

    if (!createBranchResponse.ok) {
      const createBranchErrorText = await createBranchResponse.text();
      console.error('Create branch error:', createBranchErrorText);
      throw new Error(`Failed to create branch. Status code: ${createBranchResponse.status}. Response body: ${createBranchErrorText}`);
    }

    const createBranchText = await createBranchResponse.text();
    console.log('Create branch response text:', createBranchText);

    // Step 4: Create a pull request
    const createPullRequestUrl = `https://dev.azure.com/dcucereavii/${project}/_apis/git/repositories/${repoId}/pullRequests?api-version=7.1-preview.1`;
    const pullRequestBody = {
      sourceRefName: `refs/heads/${newBranch}`,
      targetRefName: `refs/heads/${targetBranch}`,
      title: `Add ${resourceType}.tfvars file`, // Use resourceType in PR title
      description: `This pull request adds the ${resourceType}.tfvars file for review.`, // Use resourceType in PR description
    };

    console.log('Create pull request body:', JSON.stringify(pullRequestBody, null, 2));

    const pullRequestResponse = await fetch(createPullRequestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`:${azureDevOpsPAT}`).toString('base64')}`
      },
      body: JSON.stringify(pullRequestBody)
    });

    if (!pullRequestResponse.ok) {
      const pullRequestErrorText = await pullRequestResponse.text();
      console.error('Create pull request error:', pullRequestErrorText);
      throw new Error(`Failed to create pull request. Status code: ${pullRequestResponse.status}. Response body: ${pullRequestErrorText}`);
    }

    const pullRequestData = await pullRequestResponse.json();
    console.log('Create pull request response data:', pullRequestData);
 

    // // Step 5: Trigger the pipeline
    // const pipelineId = '65'; // Set your pipeline ID here
    // const triggerPipelineUrl = `https://dev.azure.com/dcucereavii/${project}/_apis/pipelines/${pipelineId}/runs?api-version=${apiVersion}`;
    // const triggerPipelineBody = {
    //   resources: {
    //     repositories: {
    //       self: {
    //         refName: `refs/heads/${targetBranch}`
    //       }
    //     }
    //   }
    // };

    // console.log('Trigger pipeline request body:', JSON.stringify(triggerPipelineBody, null, 2));

    // const triggerPipelineResponse = await fetch(triggerPipelineUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Basic ${Buffer.from(`:${azureDevOpsPAT}`).toString('base64')}`
    //   },
    //   body: JSON.stringify(triggerPipelineBody)
    // });

    // if (!triggerPipelineResponse.ok) {
    //   const triggerPipelineErrorText = await triggerPipelineResponse.text();
    //   console.error('Trigger pipeline error:', triggerPipelineErrorText);
    //   throw new Error(`Failed to trigger pipeline. Status code: ${triggerPipelineResponse.status}. Response body: ${triggerPipelineErrorText}`);
    // }

    // const triggerPipelineText = await triggerPipelineResponse.text();
    // console.log('Trigger pipeline response text:', triggerPipelineText);

    // res.status(200).json({ message: 'Pipeline triggered successfully' });

    const pullRequestUrl = pullRequestData.url; // PR URL

    // Step 5: Send Teams notification
    const teamsMessage = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "0076D7",
      "summary": "New Pull Request Created",
      "sections": [{
        "activityTitle": `New Pull Request for ${resourceType}`,
        "activitySubtitle": `Branch: ${newBranch}`,
        "activityText": `A new pull request has been created to add the ${resourceType}.tfvars file.`,
        "markdown": true,
        "potentialAction": [{
          "@type": "OpenUri",
          "name": "View Pull Requests",
          "targets": [{
            "os": "default",
            "uri": pullRequestUrl
          }
          ]},
          {
            "@type": "OpenUri",
            "name": "Approve Pull Requests",
            "targets": [{
              "os": "default",
              "uri": "https://dev.azure.com/dcucereavii/_git/terraform-gitops-framework/pullrequests?_a=mine"
            }]
          }]
          }]
    };

    const teamsResponse = await fetch(teamsWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamsMessage),
    });

    if (!teamsResponse.ok) {
      const teamsErrorText = await teamsResponse.text();
      console.error('Teams notification error:', teamsErrorText);
      throw new Error(`Failed to send Teams notification. Status code: ${teamsResponse.status}. Response body: ${teamsErrorText}`);
    }

    console.log('Teams notification sent successfully.');

    res.status(200).json({ message: 'Pull request created and notification sent to Teams' });
  } catch (error) {
    console.error('Error in triggerPipeline:', error.message);
    res.status(500).json({ message: 'Failed to trigger pipeline', error: error.message });
  }
};
