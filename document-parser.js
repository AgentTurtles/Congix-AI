/**
 * Document Parser for Chrome Extension
 * Fetches and parses PDFs and Google Docs attachments
 */

/**
 * Parse document from URL
 */
async function parseDocument(url, fileName) {
  try {
    console.log('📄 Parsing document:', fileName);
    console.log('🔗 URL:', url);
    
    // Determine document type
    const fileType = getFileType(url, fileName);
    
    if (fileType === 'pdf') {
      return await parsePDF(url, fileName);
    } else if (fileType === 'googledoc') {
      return await parseGoogleDoc(url, fileName);
    } else if (fileType === 'text') {
      return await parseTextFile(url, fileName);
    } else {
      console.log('⚠️ Unsupported file type:', fileType);
      return {
        fileName,
        url,
        content: null,
        error: `Unsupported file type: ${fileType}`
      };
    }
  } catch (error) {
    console.error('❌ Error parsing document:', error);
    return {
      fileName,
      url,
      content: null,
      error: error.message
    };
  }
}

/**
 * Determine file type from URL and filename
 */
function getFileType(url, fileName) {
  const lowerUrl = url.toLowerCase();
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.endsWith('.pdf') || lowerUrl.includes('/pdf') || lowerUrl.includes('.pdf')) {
    return 'pdf';
  }
  
  if (lowerUrl.includes('docs.google.com/document')) {
    return 'googledoc';
  }
  
  if (lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
    return 'text';
  }
  
  return 'unknown';
}

/**
 * Parse PDF using PDF.js
 */
async function parsePDF(url, fileName) {
  try {
    console.log('📕 Parsing PDF via backend...');
    
    // Use backend to parse PDF (to avoid CORS issues)
    const response = await fetch('http://localhost:3000/api/parse-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, fileName })
    });
    
    if (!response.ok) {
      throw new Error('Failed to parse PDF');
    }
    
    const data = await response.json();
    
    console.log('✅ PDF parsed, length:', data.content?.length || 0);
    
    return {
      fileName,
      url,
      content: data.content,
      type: 'pdf',
      pages: data.pages
    };
  } catch (error) {
    console.error('❌ PDF parsing failed:', error);
    return {
      fileName,
      url,
      content: null,
      error: 'Could not parse PDF: ' + error.message
    };
  }
}

/**
 * Parse Google Doc
 */
async function parseGoogleDoc(url, fileName) {
  try {
    console.log('📗 Parsing Google Doc...');
    
    // Convert Google Doc URL to export format
    let exportUrl = url;
    
    // Extract document ID from URL
    const docIdMatch = url.match(/\/document\/d\/([^\/]+)/);
    if (docIdMatch) {
      const docId = docIdMatch[1];
      // Export as plain text
      exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
    }
    
    console.log('📥 Fetching from:', exportUrl);
    
    const response = await fetch(exportUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch Google Doc');
    }
    
    const content = await response.text();
    
    console.log('✅ Google Doc parsed, length:', content.length);
    
    return {
      fileName,
      url,
      content,
      type: 'googledoc'
    };
  } catch (error) {
    console.error('❌ Google Doc parsing failed:', error);
    return {
      fileName,
      url,
      content: null,
      error: 'Could not parse Google Doc: ' + error.message
    };
  }
}

/**
 * Parse plain text file
 */
async function parseTextFile(url, fileName) {
  try {
    console.log('📄 Parsing text file...');
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch text file');
    }
    
    const content = await response.text();
    
    console.log('✅ Text file parsed, length:', content.length);
    
    return {
      fileName,
      url,
      content,
      type: 'text'
    };
  } catch (error) {
    console.error('❌ Text file parsing failed:', error);
    return {
      fileName,
      url,
      content: null,
      error: 'Could not parse text file: ' + error.message
    };
  }
}

/**
 * Parse all attachments from assignment
 */
async function parseAllAttachments(attachments) {
  if (!attachments || attachments.length === 0) {
    return [];
  }
  
  console.log(`📚 Parsing ${attachments.length} attachment(s)...`);
  
  const results = await Promise.all(
    attachments.map(att => parseDocument(att.url, att.name))
  );
  
  const successful = results.filter(r => r.content !== null);
  console.log(`✅ Successfully parsed ${successful.length}/${attachments.length} documents`);
  
  return results;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseDocument,
    parseAllAttachments
  };
}
