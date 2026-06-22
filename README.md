# PMA Nesting

![Internal Tool](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Tech_Stack-React_%7C_Vite_%7C_Tailwind-blue?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-GitLab_Pages-orange?style=for-the-badge)

**PMA Nesting** is a robust and intelligent data-processing utility designed to streamline operations and enhance productivity. It serves as a static client-side web application tailored exclusively for internal operations.

---

## ✨ Features

- **📊 Advanced Data Parsing:** Seamlessly upload, parse, and handle `.xlsx` and `.csv` dataset files locally.
- **🔍 Intelligent Filtering:** Dynamic order selectors and article filtering systems to drill down into sizes, models, and color-specific quantities.
- **🧮 Fast Nesting & Summarization:** Perform complex order aggregations and breakdown reports entirely in the browser, with no server dependency.
- **📝 Local Audit Logging:** Track usage telemetry such as generated reports and operations performed. Logs are securely saved in the browser's LocalStorage and can be exported as a CSV report.
- **🌓 Adaptive Theming:** Fully responsive interface equipped with modern Light & Dark modes for optimal viewing comfort.
- **⚡ Static Deployment Ready:** 100% decoupled from backend infrastructure. Engineered directly for static hosting natively on GitLab Pages via Kubernetes.

---

## 🛠️ Technology Stack

This application is built with modern frontend architecture to guarantee performance, scalability, and maintainability:

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v3)
- **Icons:** Lucide React
- **Data Processing:** SheetJS (`xlsx`)

---

## 🚀 Getting Started

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://pcggit.pouchen.com/pcm-it-pma/pma-nesting.git
   cd pma-nesting
   ```

2. **Install Dependencies:**
   (Ensure you have access to the internal Pouchen NPM Registry set via `.npmrc`)
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```
   *The optimized static assets will be output to the `dist/` directory.*

---

## 🔄 CI/CD & Deployment

This project utilizes GitLab CI/CD for automated deployments.

When changes are pushed to the `main` branch, the `.gitlab-ci.yml` pipeline triggers automatically:
1. Provisions an internal `node:22-alpine` Docker image via the `SGP-Prod-K8s` runners.
2. Installs dependencies utilizing the internal `.npmrc` registry.
3. Compiles the TypeScript/React application.
4. Publishes the generated static artifacts to GitLab Pages.

---

<br/>
<div align="center">
  <h3>Professional internal tools developed by PCM-IT Myanmar Team</h3>
  <p>Built with ❤️ & ☕ by Htet Aung Hlaing_ting</p>
  <p>© 2026 All Rights Reserved</p>
</div>
