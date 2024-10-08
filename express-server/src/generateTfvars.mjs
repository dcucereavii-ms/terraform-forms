import fs from 'fs/promises';

/**
 * Function to generate a .tfvars file from the provided parameters
 * @param {Object} parameters - The parameters to be written to the .tfvars file
 * @param {string} tfvarsPath - The path where the .tfvars file should be saved
 */
export const generateTfvars = async (parameters, tfvarsPath) => {
  // Only include the actual parameters in the content, excluding the resource type
  const tfvarsContent = Object.entries(parameters)
    .map(([key, value]) => `${key} = "${value}"`)
    .join('\n');

  try {
    await fs.writeFile(tfvarsPath, tfvarsContent);
    console.log(`.tfvars file has been generated at: ${tfvarsPath}`);
  } catch (error) {
    throw new Error(`Failed to generate .tfvars file: ${error.message}`);
  }
};
