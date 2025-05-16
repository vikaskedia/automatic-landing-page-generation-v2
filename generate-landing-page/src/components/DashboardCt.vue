<template>
  <div class="app-container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <i class="fas fa-magic"></i>
          <h1>Landing Page Generator</h1>
        </div>
        <nav class="nav-menu">
          <a href="#" class="active">Home</a>
          <a href="#">Templates</a>
          <a href="#">About</a>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <div class="dashboard-container">
        <div class="welcome-section">
          <h2>Create Your Landing Page</h2>
          <p class="subtitle">Transform your ideas into a professional landing page in minutes</p>
        </div>

        <div class="input-section">
          <div class="input-card">
            <div class="card-header">
              <i class="fas fa-pencil-alt"></i>
              <h3>Page Description</h3>
            </div>
            <p class="goal-message">Enter your requirements for the landing page below. Include attorney name, location, and any specific details.</p>
            <textarea 
              v-model="pageDescription" 
              placeholder="Example: Create a landing page for John Smith, Family Law Attorney in San Diego. Focus on divorce and child custody cases."
              class="description-input"
            ></textarea>

            <!-- Image Upload Section -->
            <div class="image-upload-section">
              <div class="card-header">
                <i class="fas fa-images"></i>
                <h3>Upload Images</h3>
              </div>
              <div class="upload-area" 
                @dragover.prevent 
                @drop.prevent="handleDrop"
                :class="{ 'has-images': selectedImages.length > 0 }"
              >
                <input 
                  type="file" 
                  ref="fileInput" 
                  @change="handleFileSelect" 
                  accept="image/*" 
                  multiple
                  class="file-input"
                >
                <div v-if="selectedImages.length === 0" class="upload-placeholder">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <p>Drag & drop images here or click to select</p>
                  <p class="upload-hint">Supported formats: JPG, PNG, GIF (Max size: 5MB per image, up to 5 images)</p>
                </div>
                <div v-else class="images-preview">
                  <div v-for="(image, index) in selectedImages" :key="index" class="image-preview-item">
                    <img :src="image.preview" alt="Preview">
                    <button @click="removeImage(index)" class="remove-image">×</button>
                  </div>
                </div>
              </div>
            </div>

            <button 
              @click="generateLandingPage" 
              :disabled="loading || !pageDescription.trim()"
              class="submit-button"
            >
              <i class="fas" :class="loading ? 'fa-spinner fa-spin' : 'fa-magic'"></i>
              {{ loading ? 'Generating...' : 'Generate Landing Page' }}
            </button>
          </div>
        </div>

        <div v-if="error" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          {{ error }}
        </div>

        <div v-if="successMessage" class="success-message">
          <i class="fas fa-check-circle"></i>
          <p>{{ successMessage }}</p>
          <a v-if="generatedPageUrl" :href="generatedPageUrl" target="_blank" class="view-page-link">
            <i class="fas fa-external-link-alt"></i>
            View Generated Page
          </a>
        </div>

        <!-- Generated Pages List -->
        <div class="generated-pages-section">
          <div class="card-header">
            <i class="fas fa-history"></i>
            <h2>Generated Pages</h2>
          </div>
          <div v-if="loadingPages" class="loading-message">
            <i class="fas fa-spinner fa-spin"></i>
            Loading pages...
          </div>
          <div v-else-if="generatedPages.length === 0" class="no-pages-message">
            <i class="fas fa-folder-open"></i>
            No landing pages generated yet.
          </div>
          <div v-else>
            <div class="pages-list">
              <div v-for="page in paginatedPages" :key="page.filename" class="page-item">
                <div class="page-info">
                  <span class="page-date"><i class="far fa-clock"></i> {{ formatDate(page.createdAt) }}</span>
                  <span class="page-filename"><i class="far fa-file-alt"></i> {{ page.filename }}</span>
                </div>
                <a :href="`http://localhost:3000${page.url}`" target="_blank" class="view-link">
                  <i class="fas fa-eye"></i>
                  View Page
                </a>
              </div>
            </div>
            
            <!-- Pagination Controls -->
            <div class="pagination" v-if="totalPages > 1">
              <button 
                class="pagination-button" 
                :disabled="currentPage === 1"
                @click="goToPrevPage"
              >
                <i class="fas fa-chevron-left"></i>
              </button>
              
              <div class="page-numbers">
                <button 
                  v-for="page in totalPages" 
                  :key="page"
                  class="page-number"
                  :class="{ active: currentPage === page }"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </button>
              </div>
              
              <button 
                class="pagination-button" 
                :disabled="currentPage === totalPages"
                @click="goToNextPage"
              >
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>About Us</h3>
          <p>We help you create professional landing pages quickly and easily using AI technology.</p>
        </div>
        <div class="footer-section">
          <h3>Quick Links</h3>
          <a href="#">Home</a>
          <a href="#">Templates</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
        </div>
        <div class="footer-section">
          <h3>Contact</h3>
          <p><i class="fas fa-envelope"></i> support@landingpagegenerator.com</p>
          <p><i class="fas fa-phone"></i> +1 (555) 123-4567</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 Landing Page Generator. All rights reserved.</p>
      </div>
    </footer>
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
const selectedImages = ref([])
const imagePreview = ref('')
const fileInput = ref(null)

// Add pagination related refs
const currentPage = ref(1)
const itemsPerPage = 5

// Add computed property for paginated pages
const paginatedPages = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return generatedPages.value.slice(start, end)
})

// Add computed property for total pages
const totalPages = computed(() => {
  return Math.ceil(generatedPages.value.length / itemsPerPage)
})

// Add pagination methods
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const goToPrevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  handleFiles(files)
}

const handleDrop = (event) => {
  const files = Array.from(event.dataTransfer.files)
  handleFiles(files)
}

const handleFiles = (files) => {
  // Limit to 5 images
  const remainingSlots = 5 - selectedImages.value.length
  const filesToProcess = files.slice(0, remainingSlots)

  filesToProcess.forEach(file => {
    validateAndAddImage(file)
  })
}

const validateAndAddImage = (file) => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    error.value = 'Please select only image files'
    return
  }

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Each image should be less than 5MB'
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    selectedImages.value.push({
      file: file,
      preview: e.target.result
    })
  }
  reader.readAsDataURL(file)
  error.value = ''
}

const removeImage = (index) => {
  selectedImages.value.splice(index, 1)
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
    
    // Append all selected images
    selectedImages.value.forEach((imageData, index) => {
      formData.append('images', imageData.file)
    })

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
      selectedImages.value = []
      if (fileInput.value) {
        fileInput.value.value = ''
      }
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
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
}

/* Header Styles */
.header {
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #2c3e50;
}

.logo i {
  font-size: 1.5rem;
  color: #4CAF50;
}

.logo h1 {
  font-size: 1.5rem;
  margin: 0;
  font-weight: 600;
}

.nav-menu {
  display: flex;
  gap: 2rem;
}

.nav-menu a {
  color: #2c3e50;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.nav-menu a:hover,
.nav-menu a.active {
  background-color: #4CAF50;
  color: white;
}

/* Main Content Styles */
.main-content {
  flex: 1;
  padding: 2rem 0;
}

.dashboard-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 2rem;
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-section h2 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.2rem;
  color: #666;
}

.input-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 2rem;
  margin-bottom: 2rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.card-header i {
  font-size: 1.2rem;
  color: #4CAF50;
}

.card-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

/* Existing styles with improvements */
.description-input {
  width: 100%;
  min-height: 150px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  transition: border-color 0.3s ease;
}

.description-input:focus {
  border-color: #4CAF50;
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background-color: #fafafa;
  margin-bottom: 1.5rem;
}

.upload-area:hover {
  border-color: #4CAF50;
  background-color: #f5f5f5;
}

.submit-button {
  width: 100%;
  background-color: #4CAF50;
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-button:hover {
  background-color: #45a049;
  transform: translateY(-1px);
}

.submit-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  transform: none;
}

/* Footer Styles */
.footer {
  background-color: #2c3e50;
  color: white;
  padding: 3rem 0 0;
  margin-top: 4rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.footer-section h3 {
  color: #4CAF50;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.footer-section a {
  color: white;
  text-decoration: none;
  display: block;
  margin-bottom: 0.5rem;
  transition: color 0.3s ease;
}

.footer-section a:hover {
  color: #4CAF50;
}

.footer-section p {
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.footer-bottom {
  text-align: center;
  padding: 1.5rem 0;
  margin-top: 3rem;
  border-top: 1px solid rgba(255,255,255,0.1);
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .nav-menu {
    flex-direction: column;
    gap: 0.5rem;
  }

  .footer-content {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .footer-section p {
    justify-content: center;
  }
}

/* Keep existing styles for other elements */
.goal-message {
  margin-bottom: 1rem;
  color: #666;
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

.images-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  width: 100%;
}

.image-preview-item {
  position: relative;
  width: 100%;
  height: 150px;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview-item .remove-image {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.image-preview-item .remove-image:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1);
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

/* Pagination Styles */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.pagination-button {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-button:hover:not(:disabled) {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.5rem;
}

.page-number {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 2.5rem;
}

.page-number:hover:not(.active) {
  background: #e9ecef;
}

.page-number.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

/* Responsive Pagination */
@media (max-width: 768px) {
  .pagination {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .page-numbers {
    order: 2;
    width: 100%;
    justify-content: center;
    margin: 0.5rem 0;
  }
  
  .pagination-button {
    order: 1;
  }
}
</style> 