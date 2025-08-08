class TrainingChatbot {
  constructor() {
    this.container = document.getElementById('chatbot-container');
    this.messages = document.getElementById('chatbot-messages');
    this.input = document.getElementById('chatbot-input');
    this.sendBtn = document.getElementById('chatbot-send');
    this.toggleBtn = document.getElementById('chatbot-toggle');
    
    this.awsConfig = {
      region: 'us-west-2',
      knowledgeBaseId: 'QARYFUMACU', 
      modelArn: 'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0'
    };
    
    this.init();
  }

  init() {
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
    this.toggleBtn.addEventListener('click', () => this.toggleChat());
    
    this.addMessage('Hi! I can help you with required training questions. What would you like to know?', 'bot');
  }

  toggleChat() {
    this.container.classList.toggle('minimized');
    this.toggleBtn.textContent = this.container.classList.contains('minimized') ? '+' : '−';
  }

  sendMessage() {
    const message = this.input.value.trim();
    if (!message) return;

    this.addMessage(message, 'user');
    this.input.value = '';
    
    this.generateResponse(message);
  }

  addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;
    this.messages.appendChild(messageDiv);
    this.messages.scrollTop = this.messages.scrollHeight;
  }

  async generateResponse(userMessage) {
    try {
      const response = await this.queryKnowledgeBase(userMessage);
      this.addMessage(response, 'bot');
    } catch (error) {
      console.error('Knowledge base error:', error);
      this.addMessage(`Error: ${error.message || 'Knowledge base unavailable'}`, 'bot');
    }
  }

  async queryKnowledgeBase(query) {
    const payload = {
      knowledgeBaseId: this.awsConfig.knowledgeBaseId,
      modelArn: this.awsConfig.modelArn,
      input: {
        text: query
      },
      retrieveAndGenerateConfiguration: {
        type: 'KNOWLEDGE_BASE',
        knowledgeBaseConfiguration: {
          knowledgeBaseId: this.awsConfig.knowledgeBaseId,
          modelArn: this.awsConfig.modelArn
        }
      }
    };

    const response = await fetch('/api/bedrock-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.output?.text || 'No response available.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new TrainingChatbot();
});