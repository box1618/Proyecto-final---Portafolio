# FINALE PROJECT --- ArtSphere Portfolio

> A centralized, interactive, and high-performance web platform designed for visual artists, designers, and illustrators to showcase their artwork in high resolution and manage custom commission requests without algorithmic distractions.

---

## Project Overview
Publishing and organizing artwork on traditional social media often limits visual presentation and direct interaction. **ArtSphere** solves this problem by offering a dynamic space where artists can categorize their pieces, display optimized galleries in high resolution, detail their creative processes, and allow clients to directly request custom commissions.

---

## Technology Stack

| Layer | Technologies |

:--- |:--- |

**Frontend** | React.js, HTML5, CSS3, Tailwind CSS, JavaScript (ES6+)[cite: 2] |

**Backend** | Node.js, Express.js (RESTful API Architecture)[cite: 2] |

**Database** | MongoDB / Firebase Firestore[cite: 2] |

**Libraries & Tools** | Axios, React Router, Cloudinary / Firebase Storage, Lucide Icons[cite: 2] |

---

## Database Entity-Relationship (MongoDB NoSQL Schema)
The system is structured using NoSQL document-oriented collections:
* **`USERS`**: Stores client and artist administrator profiles (`role`, `email`, encrypted password).

* **`CATEGORIES`**: Classifies the technical styles of art (e.g., *Digital Illustration*, *Traditional Painting*).

* **`ARTWORKS`**: Contains the visual pieces, their optimized multimedia links, and details of the creative process (`artistId`, `categoryId`).

* **`COMMISSIONS`**: Manages custom commission requests made by clients (clientId, budget, project status).

---

## Key Features & User Stories (Sprint 1)
- **High-Resolution Gallery:** Browse artwork adapted to a responsive grid without aggressive compression[cite: 2].
- **Dynamic Filtering:** Quickly filter pieces by category or artistic style[cite: 2].
- **Creative Process Details:** View sketches, color palettes, and artist notes for each project[cite: 2].
- **Secure Authentication:** Separate registration and login for clients and administrators[cite: 2].
- **Commission System:** Form for users to request custom artistic projects and services[cite: 2].

## Getting Started & Installation
1. Clone the repository
git clone https://github.com/box1618/Proyecto-final---Portafolio.git
cd ArtSphere

2. Configure the Backend
cd backend
npm install

Create a file named .env in the backend folder with the following:
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key

Start the backend server:
npm run dev

3. Configure the Frontend
cd ../frontend
npm install
npm run dev

## Security & Environment
* Database credentials and tokens are managed using environment variables (.env).

* User passwords are securely stored using hashing (bcrypt).

* Portfolio administration paths are protected using token validation (JWT).

---

##Author
* Fátima Ávila Mendoza  Lead Developer & UI/UX Designer and everything I guess
