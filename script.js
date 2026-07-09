class RemedyManager {
  constructor() {
    this.remedies = []
    this.init()
  }

  async init() {
    const res = await fetch('http://localhost:5000/api/remedies')
    this.remedies = await res.json()
    this.displayRemedies(this.remedies)
    this.setupSearch()
  }

  setupSearch() {
    const searchBar = document.getElementById('searchBar')
    searchBar.addEventListener('input', async (e) => {
      const q = e.target.value.trim()
      const res = await fetch(
        `http://localhost:5000/api/remedies?q=${encodeURIComponent(q)}`
      )
      const data = await res.json()
      this.displayRemedies(data)
    })
  }

  async getFeedback(remedyTitle) {
    const res = await fetch(
      `http://localhost:5000/api/feedback/${encodeURIComponent(remedyTitle)}`
    )
    return await res.json()
  }

  async saveFeedback(remedyTitle, rating, comment) {
    await fetch('http://localhost:5000/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        remedyTitle,
        rating,
        comment,
      }),
    })
  }

  calculateAverageRating(feedback) {
    if (feedback.length === 0) return 0
    const sum = feedback.reduce((acc, f) => acc + f.rating, 0)
    return sum / feedback.length
  }

  renderStars(rating) {
    if (rating === 0) return '★★★★★'
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    let stars = '★'.repeat(fullStars)
    if (hasHalfStar) stars += '★'
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    stars += '☆'.repeat(emptyStars)
    return stars
  }

  formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} ${months === 1 ? 'month' : 'months'} ago`
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  attachFeedbackHandlers() {
    const self = this
    // Star rating selection
    document.querySelectorAll('.star-rating .star').forEach((star) => {
      star.addEventListener('click', function () {
        const rating = parseInt(this.dataset.rating)
        const container = this.closest('.star-rating')
        const input =
          this.closest('.feedback-form').querySelector('.selected-rating')
        input.value = rating

        container.querySelectorAll('.star').forEach((s, i) => {
          if (i < rating) {
            s.style.color = '#ffc107'
          } else {
            s.style.color = '#ddd'
          }
        })
      })
    })

    // Submit feedback
    document.querySelectorAll('.submit-feedback-btn').forEach((btn) => {
      btn.addEventListener('click', function (e) {
        const remedyTitle = this.dataset.remedyTitle
        const form = this.closest('.feedback-form')
        const rating = parseInt(form.querySelector('.selected-rating').value)
        const comment = form.querySelector('.feedback-comment').value.trim()

        if (rating === 0) {
          alert('Please select a rating')
          return
        }

        self.saveFeedback(remedyTitle, rating, comment)
        const searchBar = document.getElementById('searchBar')
        const searchQuery = searchBar ? searchBar.value.trim() : ''
        // Refresh with current search query
        if (searchQuery) {
          fetch(
            `http://localhost:5000/api/remedies?q=${encodeURIComponent(
              searchQuery
            )}`
          )
            .then((res) => res.json())
            .then((data) => self.displayRemedies(data))
        } else {
          self.displayRemedies(self.remedies)
        }
      })
    })
  }

  async displayRemedies(remedies) {
    const container = document.getElementById('remediesContainer')
    if (!remedies.length) {
      container.innerHTML = '<p>No remedies found</p>'
      return
    }

    // Sort remedies by number of ingredients (descending)
    const sortedRemedies = remedies.sort((a, b) => {
      const aCount = a.ingredients ? a.ingredients.length : 0
      const bCount = b.ingredients ? b.ingredients.length : 0
      return bCount - aCount
    })

    // Helper function to split text into sentences for bullet points
    const splitIntoPoints = (text) => {
      if (!text) return []
      // Split by periods, exclamation marks, or question marks, but keep the punctuation
      return text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0)
    }

    // Fetch all feedback for all remedies
    const feedbackPromises = sortedRemedies.map((r) => this.getFeedback(r.title))
    const allFeedback = await Promise.all(feedbackPromises)

    container.innerHTML = sortedRemedies
      .map((r, index) => {
        const benefitsPoints = splitIntoPoints(r.benefits || '')
        const feedback = allFeedback[index] || []
        const avgRating = this.calculateAverageRating(feedback)
        const feedbackCount = feedback.length

        return `
        <div class="remedy-card" data-remedy-title="${r.title}">
          <h2 class="remedy-title">${r.title}</h2>

          <div class="remedy-section">
            <h3 class="remedy-section-heading">
              <span class="remedy-icon">📋</span>
              <span>Ingredients</span>
            </h3>
            <ul class="remedy-ingredients">
              ${
                r.ingredients
                  ? r.ingredients.map((i) => `<li>${i}</li>`).join('')
                  : '<li>No ingredients listed</li>'
              }
            </ul>
          </div>

          <div class="remedy-section">
            <h3 class="remedy-section-heading">
              <span class="remedy-icon">📝</span>
              <span>Instructions</span>
            </h3>
            <p class="remedy-instructions-text">${
              r.instructions || 'No instructions provided'
            }</p>
          </div>

          ${
            benefitsPoints.length > 0
              ? `
          <div class="remedy-section">
            <div class="remedy-benefits">
              <h3 class="remedy-benefits-heading">
                <span class="remedy-icon">✨</span>
                <span>Benefits</span>
              </h3>
              <ul class="remedy-benefits-list">
                ${benefitsPoints
                  .map((ben) => `<li>${ben.trim()}</li>`)
                  .join('')}
              </ul>
            </div>
          </div>
          `
              : ''
          }

          <div class="remedy-feedback-section">
            <div class="feedback-header">
              <div class="rating-display">
                <span class="stars ${
                  avgRating === 0 ? 'no-rating' : ''
                }">${this.renderStars(avgRating)}</span>
                <span class="rating-text">${
                  avgRating > 0 ? avgRating.toFixed(1) : 'No ratings yet'
                }</span>
                ${
                  feedbackCount > 0
                    ? `<span class="feedback-count">(${feedbackCount} ${
                        feedbackCount === 1 ? 'review' : 'reviews'
                      })</span>`
                    : ''
                }
              </div>
              <button class="leave-feedback-btn" onclick="this.closest('.remedy-card').querySelector('.feedback-form').style.display='block'; this.style.display='none';">
                💬 Leave Feedback
              </button>
            </div>

            <div class="feedback-form" style="display: none;">
              <h4>Share Your Experience</h4>
              <div class="rating-input">
                <label>Rating:</label>
                <div class="star-rating">
                  ${[1, 2, 3, 4, 5]
                    .map(
                      (i) => `<span class="star" data-rating="${i}">★</span>`
                    )
                    .join('')}
                </div>
                <input type="hidden" class="selected-rating" value="0">
              </div>
              <textarea class="feedback-comment" placeholder="Share your experience with this remedy..."></textarea>
              <div class="feedback-form-buttons">
                <button class="submit-feedback-btn" data-remedy-title="${
                  r.title
                }">Submit</button>
                <button class="cancel-feedback-btn" onclick="this.closest('.remedy-card').querySelector('.feedback-form').style.display='none'; this.closest('.remedy-card').querySelector('.leave-feedback-btn').style.display='block';">Cancel</button>
              </div>
            </div>

            ${
              feedback.length > 0
                ? `
            <div class="feedback-list">
              <h4 class="feedback-list-title">Community Reviews</h4>
              ${feedback
                .map(
                  (f) => `
                <div class="feedback-item">
                  <div class="feedback-item-header">
                    <div class="feedback-rating">${this.renderStars(
                      f.rating
                    )}</div>
                    <span class="feedback-date">${this.formatDate(f.createdAt)}</span>
                  </div>
                  ${
                    f.comment
                      ? `<p class="feedback-comment-text">${f.comment}</p>`
                      : ''
                  }
                </div>
              `
                )
                .join('')}
            </div>
            `
                : ''
            }
          </div>
        </div>
      `
      })
      .join('')

    this.attachFeedbackHandlers()
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RemedyManager()
})
