const AWS = require('aws-sdk');

const bedrock = new AWS.BedrockAgentRuntime({
  region: process.env.AWS_REGION || 'us-west-2'
});

exports.handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { knowledgeBaseId, modelArn, input } = req.body;

    const params = {
      knowledgeBaseId,
      modelArn,
      input,
      retrieveAndGenerateConfiguration: {
        type: 'KNOWLEDGE_BASE',
        knowledgeBaseConfiguration: {
          knowledgeBaseId,
          modelArn
        }
      }
    };

    const response = await bedrock.retrieveAndGenerate(params).promise();
    
    res.json({
      output: {
        text: response.output.text
      }
    });
  } catch (error) {
    console.error('Bedrock query error:', error);
    res.status(500).json({ error: 'Failed to query knowledge base' });
  }
};