<template>
  <div class="dashboard-container">
    <h1>Automatic Landing Page Generator</h1>
    <div class="input-section">
      <p class="goal-message">Enter your requirements for the landing page below. Include attorney name, location, and any specific details.</p>
      <textarea 
        v-model="pageDescription" 
        placeholder="Example: Create a landing page for John Smith, Family Law Attorney in San Diego. Focus on divorce and child custody cases."
        class="description-input"
      ></textarea>

      <!-- Image Upload Section -->
      <div class="image-upload-section">
        <div class="upload-area" 
          @dragover.prevent 
          @drop.prevent="handleDrop"
          :class="{ 'has-image': selectedImage }"
        >
          <input 
            type="file" 
            ref="fileInput" 
            @change="handleFileSelect" 
            accept="image/*" 
            class="file-input"
          >
          <div v-if="!selectedImage" class="upload-placeholder">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Drag & drop an image here or click to select</p>
            <p class="upload-hint">Supported formats: JPG, PNG, GIF (Max size: 5MB)</p>
          </div>
          <div v-else class="image-preview">
            <img :src="imagePreview" alt="Preview">
            <button @click="removeImage" class="remove-image">×</button>
          </div>
        </div>
      </div>

      <button 
        @click="generateLandingPage" 
        :disabled="loading || !pageDescription.trim()"
        class="submit-button"
      >
        {{ loading ? 'Generating...' : 'Generate Landing Page' }}
      </button>
    </div>
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    <div v-if="successMessage" class="success-message">
      <p>{{ successMessage }}</p>
      <a v-if="generatedPageUrl" :href="generatedPageUrl" target="_blank" class="view-page-link">
        View Generated Page
      </a>
    </div>

    <!-- Generated Pages List -->
    <div class="generated-pages-section">
      <h2>Generated Landing Pages</h2>
      <div v-if="loadingPages" class="loading-message">
        Loading pages...
      </div>
      <div v-else-if="generatedPages.length === 0" class="no-pages-message">
        No landing pages generated yet.
      </div>
      <div v-else class="pages-list">
        <div v-for="page in generatedPages" :key="page.filename" class="page-item">
          <div class="page-info">
            <span class="page-date">{{ formatDate(page.createdAt) }}</span>
            <span class="page-filename">{{ page.filename }}</span>
          </div>
          <a :href="`http://localhost:3000${page.url}`" target="_blank" class="view-link">
            View Page
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useCookies } from 'vue3-cookies'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const pageDescription = ref('')
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const generatedPageUrl = ref('')
const generatedPages = ref([])
const loadingPages = ref(false)
const selectedImage = ref(null)
const imagePreview = ref('')
const fileInput = ref(null)

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    validateAndSetImage(file)
  }
}

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file) {
    validateAndSetImage(file)
  }
}

const validateAndSetImage = (file) => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    error.value = 'Please select an image file'
    return
  }

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Image size should be less than 5MB'
    return
  }

  selectedImage.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
  error.value = ''
}

const removeImage = () => {
  selectedImage.value = null
  imagePreview.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const fetchGeneratedPages = async () => {
  try {
    loadingPages.value = true
    const response = await axios.get('http://localhost:3000/api/landing-pages')
    if (response.data.success) {
      generatedPages.value = response.data.pages
    }
  } catch (error) {
    console.error('Error fetching pages:', error)
  } finally {
    loadingPages.value = false
  }
}

const generateLandingPage = async () => {
  if (!pageDescription.value.trim()) {
    error.value = 'Please enter a description for the landing page'
    return
  }

  try {
    loading.value = true
    successMessage.value = ''
    generatedPageUrl.value = ''
    error.value = ''
    
    const formData = new FormData()
    formData.append('description', pageDescription.value)
    if (selectedImage.value) {
      formData.append('image', selectedImage.value)
    }

    const response = await axios.post('http://localhost:3000/api/generate-landing-page', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data.success) {
      successMessage.value = response.data.message
      generatedPageUrl.value = `http://localhost:3000${response.data.fileUrl}`
      // Clear the form
      pageDescription.value = ''
      removeImage()
      // Refresh the list of pages
      await fetchGeneratedPages()
    }
  } catch (error) {
    console.error('Error:', error)
    successMessage.value = 'Error generating landing page. Please try again.'
  } finally {
    loading.value = false
  }
}

// Fetch pages when component mounts
onMounted(() => {
  fetchGeneratedPages()
})
</script>

<style scoped>
.dashboard-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.input-section {
  margin-top: 2rem;
}

.goal-message {
  margin-bottom: 1rem;
  color: #666;
}

.description-input {
  width: 100%;
  min-height: 150px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
}

/* Image Upload Styles */
.image-upload-section {
  margin-bottom: 1.5rem;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 4px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background-color: #fafafa;
}

.upload-area:hover {
  border-color: #4CAF50;
  background-color: #f5f5f5;
}

.upload-area.has-image {
  border-style: solid;
  border-color: #4CAF50;
  padding: 0;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-placeholder {
  color: #666;
}

.upload-placeholder i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #4CAF50;
}

.upload-hint {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.5rem;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.remove-image:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1);
}

.submit-button {
  background-color: #4CAF50;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.submit-button:hover {
  background-color: #45a049;
}

.submit-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: #ff0000;
  margin-top: 1rem;
}

.success-message {
  margin-top: 20px;
  padding: 15px;
  background-color: #e6ffe6;
  border: 1px solid #00cc00;
  border-radius: 4px;
  color: #006600;
}

.view-page-link {
  display: inline-block;
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #006600;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.view-page-link:hover {
  background-color: #004d00;
}

/* Generated Pages List Styles */
.generated-pages-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #ddd;
}

.generated-pages-section h2 {
  color: #333;
  margin-bottom: 1.5rem;
}

.loading-message,
.no-pages-message {
  color: #666;
  text-align: center;
  padding: 1rem;
}

.pages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8f8f8;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.page-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-date {
  color: #666;
  font-size: 0.9rem;
}

.page-filename {
  color: #333;
  font-weight: 500;
}

.view-link {
  padding: 0.5rem 1rem;
  background-color: #4CAF50;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.view-link:hover {
  background-color: #45a049;
}
</style> 