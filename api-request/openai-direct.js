const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Create landing-pages directory if it doesn't exist
const landingPagesDir = path.join(__dirname, 'landing-pages');
if (!fs.existsSync(landingPagesDir)) {
    fs.mkdirSync(landingPagesDir);
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Function to clean HTML content
const cleanHtmlContent = (content) => {
    // Remove markdown code block markers
    return content.replace(/```html\n?/g, '').replace(/```\n?/g, '');
};

// Function to generate a filename from description
const generateFilename = async (description) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a helpful assistant that generates SEO-friendly filenames for landing pages.
                    Rules for filename generation:
                    1. Use only lowercase letters, numbers, and hyphens
                    2. No spaces or special characters
                    3. Keep it under 50 characters
                    4. Make it descriptive but concise
                    5. Include main keywords from the description
                    6. Never cut words in the middle
                    7. Use abbreviations for common words if needed
                    8. Prioritize important keywords
                    
                    Examples:
                    Input: "Create a landing page for John Smith, Family Law Attorney in San Diego"
                    Output: "family-law-attorney-sd-john-smith"
                    
                    Input: "Professional Photography Studio in New York City"
                    Output: "pro-photography-studio-nyc"
                    
                    Return ONLY the filename without any random numbers, nothing else.`
                },
                {
                    role: "user",
                    content: `Generate a filename for a landing page with this description: ${description}`
                }
            ],
            temperature: 0.7,
            max_tokens: 50
        });

        let filename = completion.choices[0].message.content.trim();
        
        // Generate a random 4-digit number
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        
        // Add the random number to the filename
        filename = `${filename}-${randomNum}`;

        return filename;
    } catch (error) {
        console.error('Error generating filename:', error);
        // Fallback to timestamp-based filename if OpenAI fails
        const timestamp = Date.now();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `landing-page-${timestamp}-${randomNum}`;
    }
};

// Get list of generated landing pages
router.get('/landing-pages', (req, res) => {
    try {
        const files = fs.readdirSync(landingPagesDir);
        const landingPages = files
            .filter(file => file.endsWith('.html'))
            .map(file => ({
                filename: file,
                url: `/landing-page/${file}`,
                createdAt: fs.statSync(path.join(landingPagesDir, file)).birthtime
            }))
            .sort((a, b) => b.createdAt - a.createdAt); // Sort by newest first

        res.json({
            success: true,
            pages: landingPages
        });
    } catch (error) {
        console.error('Error getting landing pages:', error);
        res.status(500).json({
            error: 'Error getting landing pages list',
            details: error.message
        });
    }
});

router.post('/generate-landing-page', upload.single('image'), async (req, res) => {
    try {
        const { description } = req.body;
        const uploadedImage = req.file;

        if (!description) {
            return res.status(400).json({
                error: 'Invalid request format. Description is required.'
            });
        }

        // Generate filename first
        const filename = await generateFilename(description);
        const fullFilename = `${filename}.html`;
        const filePath = path.join(landingPagesDir, fullFilename);

        // Prepare image information for the prompt if an image was uploaded
        const imageInfo = uploadedImage ? `
            The user has provided an image for the landing page. 
            The image is located at: ${uploadedImage.path}
            Please incorporate this image into the design, preferably in the hero section.
            Make sure to use proper image optimization and responsive design techniques.
        ` : '';

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a professional web developer specializing in creating modern, responsive landing pages. 
                    When generating landing pages, always:
                    1. Provide complete HTML code with proper HTML5 structure
                    2. Include embedded CSS within a <style> tag in the head section
                    3. Use modern CSS features like flexbox or grid for layout
                    4. Make the design responsive and mobile-friendly
                    5. Include common sections like hero, features, about, and contact
                    6. Use semantic HTML tags
                    7. Add appropriate meta tags and viewport settings
                    8. Include placeholder images using placeholder.com or similar services
                    9. Use a clean, modern color scheme
                    10. Add hover effects and smooth transitions
                    
                    Format your response as a complete HTML document that can be directly used.`
                },
                {
                    role: "user",
                    content: `Generate a complete landing page HTML template with embedded CSS based on this description: ${description}${imageInfo}`
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        // Clean the HTML content and save to file
        const cleanContent = cleanHtmlContent(completion.choices[0].message.content);
        fs.writeFileSync(filePath, cleanContent);

        res.json({
            success: true,
            fileUrl: `/landing-page/${fullFilename}`,
            message: 'Landing page generated successfully'
        });

    } catch (error) {
        console.error('OpenAI API Error:', error);
        res.status(500).json({
            error: 'Error processing your request',
            details: error.message
        });
    }
});

module.exports = router;
