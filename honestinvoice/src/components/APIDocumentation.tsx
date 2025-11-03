import React, { useState } from 'react';
import { Book, Code, AlertCircle, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const APIDocumentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'examples' | 'rate-limits'>('overview');
  const [activeAI, setActiveAI] = useState<'gemini' | 'chatgpt' | 'claude' | 'ollama'>('gemini');

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Copied to clipboard');
  };

  const baseUrl = 'https://hqlefdadfjdxxzzbtjqk.supabase.co/functions/v1/api-v1';

  const endpoints = [
    {
      method: 'GET',
      path: '/invoices',
      description: 'List all invoices',
      params: 'limit (optional), offset (optional), status (optional)'
    },
    {
      method: 'POST',
      path: '/invoices',
      description: 'Create a new invoice',
      params: 'customer_id, invoice_number, grand_total, due_date, etc.'
    },
    {
      method: 'PUT',
      path: '/invoices/:id',
      description: 'Update an invoice',
      params: 'status, grand_total, etc.'
    },
    {
      method: 'GET',
      path: '/customers',
      description: 'List all customers',
      params: 'limit (optional), offset (optional)'
    },
    {
      method: 'POST',
      path: '/customers',
      description: 'Create a new customer',
      params: 'name, email, billing_address, etc.'
    },
    {
      method: 'GET',
      path: '/analytics',
      description: 'Get analytics data',
      params: 'None'
    },
    {
      method: 'GET',
      path: '/me',
      description: 'Get current user information',
      params: 'None'
    }
  ];

  const aiExamples = {
    gemini: {
      name: 'Google Gemini',
      setup: `import google.generativeai as genai
import requests
import json

# Configure Gemini
genai.configure(api_key='YOUR_GEMINI_API_KEY')
model = genai.GenerativeModel('gemini-pro')

# HonestInvoice API credentials
API_KEY = 'hi_your_api_key_here'
BASE_URL = '${baseUrl}'`,
      example: String.raw`def create_invoice_with_ai(customer_name, amount, description):
    """Use Gemini to generate invoice details, then create via API"""
    
    # Step 1: Use Gemini to generate invoice content
    prompt = f"""
    Generate a professional invoice for:
    Customer: {{customer_name}}
    Amount: \${{amount}}
    Description: {{description}}
    
    Provide:
    - Invoice number (format: INV-YYYY-MM-XXXXX)
    - Itemized breakdown
    - Payment terms
    - Due date (30 days from now)
    
    Return as JSON format.
    """
    
    response = model.generate_content(prompt)
    invoice_data = json.loads(response.text)
    
    # Step 2: Create invoice via HonestInvoice API
    headers = {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
    }
    
    payload = {
        'customer_id': invoice_data['customer_id'],
        'invoice_number': invoice_data['invoice_number'],
        'grand_total': amount,
        'due_date': invoice_data['due_date'],
        'items': invoice_data['items']
    }
    
    response = requests.post(
        f'{BASE_URL}/invoices',
        headers=headers,
        json=payload
    )
    
    return response.json()

# Usage
result = create_invoice_with_ai(
    'Acme Corp',
    1500.00,
    'Website development services'
)
print(result)`
    },
    chatgpt: {
      name: 'OpenAI ChatGPT',
      setup: `from openai import OpenAI
import requests
import json

# Configure OpenAI
client = OpenAI(api_key='YOUR_OPENAI_API_KEY')

# HonestInvoice API credentials
API_KEY = 'hi_your_api_key_here'
BASE_URL = '${baseUrl}'`,
      example: `def analyze_invoices_with_gpt():
    """Use GPT-4 to analyze invoice patterns and get insights"""
    
    # Step 1: Fetch invoices from HonestInvoice
    headers = {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
    }
    
    response = requests.get(f'{BASE_URL}/invoices', headers=headers)
    invoices = response.json()['data']
    
    # Step 2: Analyze with GPT-4
    prompt = f"""
    Analyze these invoices and provide insights:
    {json.dumps(invoices, indent=2)}
    
    Provide:
    1. Total revenue trend
    2. Payment patterns
    3. Late payment risk
    4. Recommendations for cash flow improvement
    """
    
    completion = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a financial analyst."},
            {"role": "user", "content": prompt}
        ]
    )
    
    insights = completion.choices[0].message.content
    return insights

# Usage
insights = analyze_invoices_with_gpt()
print(insights)`
    },
    claude: {
      name: 'Anthropic Claude',
      setup: `import anthropic
import requests
import json

# Configure Anthropic
client = anthropic.Anthropic(api_key='YOUR_ANTHROPIC_API_KEY')

# HonestInvoice API credentials
API_KEY = 'hi_your_api_key_here'
BASE_URL = '${baseUrl}'`,
      example: `def process_customer_inquiry(customer_email, question):
    """Use Claude to handle customer invoice inquiries"""
    
    # Step 1: Fetch customer's invoices
    headers = {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
    }
    
    # Get customer invoices
    response = requests.get(
        f'{BASE_URL}/invoices?customer_email={customer_email}',
        headers=headers
    )
    invoices = response.json()['data']
    
    # Step 2: Use Claude to analyze and respond
    message = client.messages.create(
        model="claude-3-opus-20240229",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"""
            Customer email: {customer_email}
            Question: {question}
            
            Their invoices:
            {json.dumps(invoices, indent=2)}
            
            Provide a helpful, professional response.
            """
        }]
    )
    
    response_text = message.content[0].text
    
    # Step 3: Send email notification (optional)
    email_data = {
        'to': customer_email,
        'subject': 'Response to your invoice inquiry',
        'email_type': 'system_notification',
        'template_data': {
            'message': response_text
        }
    }
    
    requests.post(
        'https://hqlefdadfjdxxzzbtjqk.supabase.co/functions/v1/send-email',
        headers=headers,
        json=email_data
    )
    
    return response_text

# Usage
response = process_customer_inquiry(
    'customer@example.com',
    'When is my invoice due?'
)
print(response)`
    },
    ollama: {
      name: 'Ollama (Local)',
      setup: `import requests
import json

# Ollama local server
OLLAMA_URL = 'http://localhost:11434'

# HonestInvoice API credentials
API_KEY = 'hi_your_api_key_here'
BASE_URL = '${baseUrl}'`,
      example: String.raw`def categorize_expenses_with_ollama():
    """Use Ollama (local LLM) to categorize invoice items"""
    
    # Step 1: Fetch invoices from HonestInvoice
    headers = {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
    }
    
    response = requests.get(f'{BASE_URL}/invoices', headers=headers)
    invoices = response.json()['data']
    
    categorized = []
    
    for invoice in invoices:
        # Step 2: Use Ollama to categorize each invoice
        prompt = f"""
        Categorize this invoice item:
        Description: {invoice.get('description', 'N/A')}
        Amount: {invoice.get('grand_total', 0)}
        
        Categories: Software, Hardware, Services, Marketing, Operations
        
        Return only the category name.
        """
        
        ollama_response = requests.post(
            f'{OLLAMA_URL}/api/generate',
            json={
                'model': 'llama2',
                'prompt': prompt,
                'stream': False
            }
        )
        
        category = ollama_response.json()['response'].strip()
        
        categorized.append({
            'invoice_id': invoice['id'],
            'invoice_number': invoice['invoice_number'],
            'category': category,
            'amount': invoice['grand_total']
        })
    
    return categorized

# Usage
categorized_invoices = categorize_expenses_with_ollama()
# Print each item
for item in categorized_invoices:
    print(f"Invoice: {item['invoice_number']}, Category: {item['category']}")`
    }
  };

  const rateLimits = {
    free: { hourly: 100, minute: 10 },
    pro: { hourly: 500, minute: 50 },
    business: { hourly: 1000, minute: 100 }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Book className="w-8 h-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
        </div>
        <p className="text-gray-600">
          Comprehensive guide for integrating HonestInvoice with AI agents (Gemini, ChatGPT, Claude, Ollama)
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'endpoints', 'examples', 'rate-limits'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Authentication */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication</h2>
              <p className="text-gray-600 mb-4">
                All API requests require an API key in the request header:
              </p>
              <div className="bg-gray-900 rounded-lg p-4 relative group">
                <code className="text-green-400 font-mono text-sm">
                  x-api-key: hi_your_api_key_here
                </code>
                <button
                  onClick={() => copyCode('x-api-key: hi_your_api_key_here')}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </section>

            {/* Base URL */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Base URL</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <code className="text-blue-900 font-mono">{baseUrl}</code>
              </div>
            </section>

            {/* Error Handling */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Handling</h2>
              <p className="text-gray-600 mb-4">
                The API returns standard HTTP status codes and JSON error responses:
              </p>
              <div className="bg-gray-900 rounded-lg p-4">
                <pre className="text-green-400 font-mono text-sm">
{`{
  "error": {
    "code": "BUSINESS_TIER_REQUIRED",
    "message": "API access requires Business tier subscription"
  }
}`}
                </pre>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'endpoints' && (
          <div className="space-y-6">
            {endpoints.map((endpoint, index) => (
              <section key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold mr-3 ${
                    endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                    endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-lg font-mono text-gray-900">{endpoint.path}</code>
                </div>
                <p className="text-gray-600 mb-4">{endpoint.description}</p>
                {endpoint.params && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Parameters:</h4>
                    <code className="text-sm text-gray-600">{endpoint.params}</code>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="space-y-6">
            {/* AI Framework Selector */}
            <div className="flex space-x-4 mb-6">
              {Object.entries(aiExamples).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setActiveAI(key as any)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    activeAI === key
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {value.name}
                </button>
              ))}
            </div>

            {/* Setup Code */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Setup</h2>
              <div className="bg-gray-900 rounded-lg p-4 relative group">
                <pre className="text-green-400 font-mono text-sm overflow-x-auto">
                  {aiExamples[activeAI].setup}
                </pre>
                <button
                  onClick={() => copyCode(aiExamples[activeAI].setup)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </section>

            {/* Example Code */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Example Implementation</h2>
              <div className="bg-gray-900 rounded-lg p-4 relative group">
                <pre className="text-green-400 font-mono text-sm overflow-x-auto">
                  {aiExamples[activeAI].example}
                </pre>
                <button
                  onClick={() => copyCode(aiExamples[activeAI].example)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'rate-limits' && (
          <div className="space-y-6">
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Rate Limits by Tier</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(rateLimits).map(([tier, limits]) => (
                  <div key={tier} className="border-2 border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize mb-4">{tier} Tier</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-600">Hourly Limit</div>
                        <div className="text-2xl font-bold text-gray-900">{limits.hourly}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Per Minute</div>
                        <div className="text-2xl font-bold text-gray-900">{limits.minute}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">Rate Limit Headers</h3>
                  <p className="text-yellow-800 mb-4">
                    All API responses include rate limit information in the headers:
                  </p>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-green-400 font-mono text-sm">
{`X-RateLimit-Limit-Hourly: 1000
X-RateLimit-Remaining-Hourly: 950
X-RateLimit-Limit-Minute: 100
X-RateLimit-Remaining-Minute: 95`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default APIDocumentation;
