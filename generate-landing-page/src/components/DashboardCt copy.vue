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
      <button 
        @click="generateLandingPage" 
        :disabled="loading"
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

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
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
    
    const response = await axios.post('http://localhost:3000/api/generate-landing-page', {
      description: pageDescription.value
    })

    if (response.data.success) {
      successMessage.value = response.data.message
      generatedPageUrl.value = `http://localhost:3000${response.data.fileUrl}`
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