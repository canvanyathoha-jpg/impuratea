import { languageManager } from './LanguageManager.js';

export default class OpeningStory {
    constructor(sceneData) {
        this.sceneData = sceneData;
        this.overlay = null;
        this.languageManager = languageManager;
    }

    show() {
        console.log(`[OpeningStory] Showing opening for:`, this.sceneData.title);

        // Create opening story overlay with dark background
        this.overlay = document.createElement('div');
        this.overlay.id = 'opening-story-overlay';

        // Translate title, story, and quote using languageManager
        const title = this.languageManager.translate(this.sceneData.title);
        const story = this.sceneData.story ?
            (Array.isArray(this.sceneData.story) ?
                this.sceneData.story.map(p => this.languageManager.translate(p)) :
                [this.languageManager.translate(this.sceneData.story)]
            ) : [];
        const quote = this.languageManager.translate(this.sceneData.quote);

        console.log(`[OpeningStory] Using title: ${title}`);
        console.log(`[OpeningStory] Using story: ${story.length} paragraphs`);
        console.log(`[OpeningStory] Using quote: ${quote}`);

        // Hanya tampilkan judul jika title tidak kosong
        const titleHTML = title ? `<h1 style="font-size: 48px; margin-bottom: 30px; color: #ff6b6b; text-shadow: 0 0 20px rgba(255,107,107,0.8); font-weight: bold;">${title}</h1>` : '';
        
        this.overlay.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 10000000; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; font-family: 'Arial', sans-serif; cursor: pointer;">
                <div style="max-width: 800px; text-align: center; padding: 40px; opacity: 1; transform: translateY(0); transition: all 1s ease; background: rgba(0,0,0,0.95); border-radius: 20px; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
                    ${titleHTML}
                    <div style="font-size: 24px; line-height: 1.8; margin-bottom: 40px; color: white; text-shadow: 0 2px 10px rgba(0,0,0,0.8);">
                        ${story.map(paragraph => 
                            `<p style="margin-bottom: 20px; color: white;">${paragraph}</p>`
                        ).join('')}
                        <p style="font-style: italic; color: #4ecdc4; font-size: 22px; margin-top: 20px;">"${quote}"</p>
                    </div>
                    <div style="font-size: 16px; color: rgba(255,255,255,0.8); margin-top: 30px; font-style: italic;">
                        ${this.languageManager.translate({
                            id: "Klik di mana saja untuk melanjutkan...",
                            en: "Click anywhere to continue..."
                        })}
                    </div>
                </div>
            </div>
        `;

        // Add to document
        document.body.appendChild(this.overlay);
        console.log(`[OpeningStory] Opening story overlay added for: ${this.sceneData.title}`);
        console.log(`[OpeningStory] Title: ${this.sceneData.title}`);
        console.log(`[OpeningStory] Story paragraphs: ${this.sceneData.story.length}`);
        console.log(`[OpeningStory] Quote: ${this.sceneData.quote}`);

        // Content is already visible (opacity: 1), but add a subtle animation
        setTimeout(() => {
            const content = this.overlay.querySelector('div > div');
            if (content) {
                // Add a subtle scale animation
                content.style.transform = 'translateY(0) scale(1)';
                console.log(`[OpeningStory] Opening story content displayed for: ${this.sceneData.title}`);
                console.log(`[OpeningStory] Content element found and animated`);
            } else {
                console.error(`[OpeningStory] Content element not found!`);
            }
        }, 100);

        // Add click event listener to entire overlay
        this.overlay.addEventListener('click', () => {
            console.log(`[OpeningStory] Opening story clicked for: ${this.sceneData.title}`);
            this.hide();
        });

        return new Promise((resolve) => {
            this.resolve = resolve;
        });
    }

    hide() {
        console.log(`[OpeningStory] Hiding opening for: ${this.sceneData.title}`);
        
        if (this.overlay) {
            // Fade out animation
            this.overlay.style.transition = 'opacity 0.5s ease';
            this.overlay.style.opacity = '0';
            
            setTimeout(() => {
                // Remove overlay completely
                this.overlay.remove();
                this.overlay = null;
                console.log(`[OpeningStory] Opening story completely removed for: ${this.sceneData.title}`);
                
                // Resolve the promise to continue scene initialization
                if (this.resolve) {
                    this.resolve();
                }
            }, 500); // Faster fade out
        }
    }

    dispose() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
}

// Predefined scene data (Bilingual: Indonesian & English)
export const SCENE_DATA = {
    og_scene1: {
        title: "", // No title
        story: [
            {
                id: "Kamu adalah seorang siswa yang baru saja bergabung dengan organisasi siswa di sekolah. Sebagai bendahara junior, kamu bertanggung jawab mengelola dana organisasi.",
                en: "You are a student who just joined the student organization at school. As a junior treasurer, you are responsible for managing the organization's funds."
            },
            {
                id: "Hari ini, Senior Bendahara memanggilmu untuk membicarakan sesuatu yang penting...",
                en: "Today, the Senior Treasurer calls you to discuss something important..."
            }
        ],
        quote: {
            id: "Ada hal yang perlu kita diskusikan tentang dana acara kita.",
            en: "There's something we need to discuss about our event funds."
        }
    },

    og_scene2: {
        title: {
            id: "Scene 2: Ruang Kelas",
            en: "Scene 2: Classroom"
        },
        story: [
            {
                id: "Setelah pertemuan dengan Senior Bendahara, kamu merasa tidak nyaman dengan permintaannya.",
                en: "After the meeting with the Senior Treasurer, you feel uncomfortable with their request."
            },
            {
                id: "Di ruang kelas, kamu bertemu dengan teman sekelas yang juga anggota organisasi yang sama.",
                en: "In the classroom, you meet a classmate who is also a member of the same organization."
            }
        ],
        quote: {
            id: "Kamu terlihat tidak enak badan, ada apa?",
            en: "You look troubled. What's wrong?"
        }
    },

    og_scene2a: {
        title: "", // No title
        story: [
            {
                id: "Mendengar jawabanmu, Ketua OSIS terlihat panik dan Senior terlihat marah.",
                en: "Hearing your answer, the Student Council President looks panicked and the Senior looks angry."
            },
            {
                id: "Kemudian Senior memanggilmu untuk berbicara tentang sesuatu yang penting.",
                en: "Then the Senior calls you to discuss something important."
            }
        ],
        quote: {
            id: "Uang ini akan saya berikan ke Ketua OSIS. Dia yang akan menyiapkan acaranya, jadi tugas kamu lebih ringan.",
            en: "I will give this money to the Student Council President. He will prepare the event, so your task will be lighter."
        }
    },

    og_scene2b: {
        title: "", // No title
        story: [
            {
                id: "Kamu telah memberikan uang dan memanipulasi laporan anggaran.",
                en: "You have given the money and manipulated the budget report."
            },
            {
                id: "Ketua OSIS lega dan Senior tersenyum lebar. Uang diberikan dan kamu mendapat kepercayaan senior.",
                en: "The Student Council President is relieved and the Senior smiles widely. The money is handed over and you gain the senior's trust."
            },
            {
                id: "Setelah selesai bertemu, kamu bertemu dengan Pembina OSIS yang menanyakan apa yang terjadi dan mengapa bendahara memberikan uang ke Ketua OSIS dan Senior.",
                en: "After the meeting, you encounter the Student Council Advisor who asks what happened and why the treasurer gave money to the President and Senior."
            }
        ],
        quote: {
            id: "Mengapa bendahara memberikan uang ke Ketua OSIS dan Senior?",
            en: "Why did the treasurer give money to the Student Council President and Senior?"
        }
    },

    og_scene3a: {
        title: "", // No title
        story: [
            {
                id: "Kamu jujur dan hampir dihukum pembina, tapi pembina tahu apa yang dilakukan ketua OSIS dan senior.",
                en: "You are honest and almost punished by the advisor, but the advisor knows what the President and Senior did."
            },
            {
                id: "Sekarang kamu harus mencari vendor untuk mendukung dana karena senior tidak mendukung vendor lagi.",
                en: "Now you have to find a vendor to support the funds because the senior no longer supports any vendor."
            },
            {
                id: "Kamu menemukan vendor yang mau bekerja sama dengan syarat khusus.",
                en: "You find a vendor willing to cooperate with special conditions."
            }
        ],
        quote: {
            id: "Saya bisa jadi vendor kalian, tapi pakai sistem khusus: tandatangan tanpa laporan resmi.",
            en: "I can be your vendor, but with a special system: signatures without official reports."
        }
    },

    og_scene3b: {
        title: "", // No title
        story: [
            {
                id: "Kamu bekerja sama dengan ketua OSIS dan senior, serta mendapat kepercayaan dari senior.",
                en: "You cooperate with the Student Council President and senior, and gain their trust."
            },
            {
                id: "Senior memberikanmu tugas untuk mencari vendor kegiatan mereka.",
                en: "The Senior assigns you the task of finding a vendor for their activities."
            },
            {
                id: "Kamu menemukan vendor yang mau bekerja sama dengan syarat khusus.",
                en: "You find a vendor willing to cooperate with special conditions."
            }
        ],
        quote: {
            id: "Saya bisa jadi vendor kalian, tapi pakai sistem khusus: tandatangan tanpa laporan resmi.",
            en: "I can be your vendor, but with a special system: signatures without official reports."
        }
    },

    og_scene4a: {
        title: "", // No title
        story: [
            {
                id: "Setelah kejadian vendor tersebut, kamu tidak bekerja sama.",
                en: "After the vendor incident, you don't cooperate."
            },
            {
                id: "Pembina OSIS marah karena kamu tidak bisa menemukan vendor.",
                en: "The Student Council Advisor is angry because you couldn't find a vendor."
            },
            {
                id: "Pembina meminta laporan keuangan untuk melihat keberlangsungan acara ke depannya.",
                en: "The advisor requests financial reports to assess the event's sustainability going forward."
            }
        ],
        quote: {
            id: "Saya perlu laporan keuangan untuk memastikan acara bisa berjalan.",
            en: "I need financial reports to ensure the event can proceed."
        }
    },

    og_scene4b: {
        title: "", // No title
        story: [
            {
                id: "Setelah kejadian vendor tersebut, kamu mau bekerja sama dan mendapat dana pribadi.",
                en: "After the vendor incident, you agree to cooperate and receive private funds."
            },
            {
                id: "Persiapan acara berjalan, vendor membantu mencetak spanduk dan menyiapkan perlengkapan.",
                en: "Event preparations proceed, the vendor helps print banners and prepare equipment."
            },
            {
                id: "Ada beberapa perlengkapan yang tidak sesuai. Pembina meminta laporan keuangan sementara.",
                en: "Some equipment doesn't match specifications. The advisor requests an interim financial report."
            }
        ],
        quote: {
            id: "Saya perlu laporan keuangan sementara untuk melihat kondisi dana.",
            en: "I need an interim financial report to review the fund's condition."
        }
    },

    og_scene3: {
        title: {
            id: "Scene 3: Kantin Kampus",
            en: "Scene 3: Campus Cafeteria"
        },
        story: [
            {
                id: "Di kantin kampus, kamu bertemu dengan senior lain yang mungkin bisa memberikan nasihat.",
                en: "In the campus cafeteria, you meet another senior who might be able to offer advice."
            },
            {
                id: "Situasi semakin rumit dan kamu perlu memutuskan langkah selanjutnya.",
                en: "The situation grows more complicated and you need to decide your next steps."
            }
        ],
        quote: {
            id: "Kadang kita harus memilih antara yang benar dan yang mudah.",
            en: "Sometimes we must choose between what is right and what is easy."
        }
    }
};
