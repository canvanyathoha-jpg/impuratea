export default class OpeningStory {
    constructor(sceneData) {
        this.sceneData = sceneData;
        this.overlay = null;
    }

    show() {
        console.log(`[OpeningStory] Showing opening for: ${this.sceneData.title}`);
        
        // Create opening story overlay with dark background
        this.overlay = document.createElement('div');
        this.overlay.id = 'opening-story-overlay';
        // Ambil data dari sceneData (jika kosong, gunakan undefined agar tidak muncul)
        const title = this.sceneData.title; // Kosong = tidak akan ditampilkan
        const story = this.sceneData.story || [
            "Kamu adalah seorang siswa yang baru saja bergabung dengan organisasi siswa di sekolah. Sebagai bendahara junior, kamu bertanggung jawab mengelola dana organisasi.",
            "Hari ini, Senior Bendahara memanggilmu untuk membicarakan sesuatu yang penting..."
        ];
        const quote = this.sceneData.quote || "Ada hal yang perlu kita diskusikan tentang dana acara kita.";
        
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
                        Klik di mana saja untuk melanjutkan...
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

// Predefined scene data
export const SCENE_DATA = {
    og_scene1: {
        title: "", // Judul tidak ditampilkan
        story: [
            "Kamu adalah seorang siswa yang baru saja bergabung dengan organisasi siswa di sekolah. Sebagai bendahara junior, kamu bertanggung jawab mengelola dana organisasi.",
            "Hari ini, Senior Bendahara memanggilmu untuk membicarakan sesuatu yang penting...",
        ],
        quote: "Ada hal yang perlu kita diskusikan tentang dana acara kita."
    },
    
    og_scene2: {
        title: "Scene 2: Ruang Kelas",
        story: [
            "Setelah pertemuan dengan Senior Bendahara, kamu merasa tidak nyaman dengan permintaannya.",
            "Di ruang kelas, kamu bertemu dengan teman sekelas yang juga anggota organisasi yang sama.",
        ],
        quote: "Kamu terlihat tidak enak badan, ada apa?"
    },
    
    og_scene2a: {
        title: "", // Judul tidak ditampilkan
        story: [
            "Mendengar jawabanmu, Ketua OSIS terlihat panik dan Senior terlihat marah.",
            "Kemudian Senior memanggilmu untuk berbicara sesuatu yang penting.",
        ],
        quote: "Uang ini akan saya berikan ke Ketua OSIS. Dia yang akan menyiapkan acaranya, jadi tugas kamu lebih ringan."
    },
    
    og_scene2b: {
        title: "", // Judul tidak ditampilkan
        story: [
            "Kamu telah memberikan uang dan memanipulasi laporan anggaran.",
            "Ketua OSIS lega dan Senior tersenyum lebar. Uang diberikan dan kamu mendapat kepercayaan senior.",
            "Setelah selesai bertemu, kamu bertemu dengan Pembina OSIS yang menanyakan apa yang terjadi dan kenapa bendahara memberikan uang ke Ketua OSIS dan Senior.",
        ],
        quote: "Kenapa bendahara memberikan uang ke Ketua OSIS dan Senior?"
    },
    
    og_scene3a: {
        title: "", // Judul tidak ditampilkan
        story: [
            "Kamu jujur dan hampir dihukum pembina, tapi pembina tahu apa yang ketua osis dan senior lakukan.",
            "Sekarang kamu harus mencari vendor untuk backup dana karena senior tidak support vendor lagi.",
            "Kamu menemukan vendor yang mau bekerjasama dengan syarat khusus.",
        ],
        quote: "Saya bisa jadi vendor, tapi pakai sistem khusus: tandatangan tanpa laporan resmi."
    },
    
    og_scene3b: {
        title: "", // Judul tidak ditampilkan
        story: [
            "Kamu bekerja sama dengan ketua osis dan senior, dan dapat kepercayaan dari senior.",
            "Senior memberikan kamu tugas untuk mencari vendor kegiatan mereka.",
            "Kamu menemukan vendor yang mau bekerjasama dengan syarat khusus.",
        ],
        quote: "Saya bisa jadi vendor, tapi pakai sistem khusus: tandatangan tanpa laporan resmi."
    },
    
    og_scene4a: {
        title: "", // Judul tidak ditampilkan
        story: [
            "Setelah kejadian vendor tersebut, kamu tidak bekerja sama.",
            "Pembina OSIS marah karena kamu tidak bisa menemukan vendor.",
            "Pembina meminta laporan keuangan untuk melihat keberlangsungan acara ke depannya.",
        ],
        quote: "Saya perlu laporan keuangan untuk memastikan acara bisa berjalan."
    },
    
    og_scene4b: {
        title: "", // Judul tidak ditampilkan
        story: [
            "Setelah kejadian vendor tersebut, kamu mau bekerja sama dan mendapat dana pribadi.",
            "Persiapan event berjalan, vendor membantu printkan spanduk dan menyiapkan perlengkapan.",
            "Ada beberapa perlengkapan yang tidak sesuai. Pembina meminta laporan keuangan sementara.",
        ],
        quote: "Saya perlu laporan keuangan sementara untuk melihat kondisi dana."
    },
    
    og_scene3: {
        title: "Scene 3: Kantin Kampus",
        story: [
            "Di kantin kampus, kamu bertemu dengan senior lain yang mungkin bisa memberikan nasihat.",
            "Situasi semakin rumit dan kamu perlu memutuskan langkah selanjutnya.",
        ],
        quote: "Kadang kita harus memilih antara yang benar dan yang mudah."
    }
};
