/**
 * Bilingual texts for Organization Scenes
 * All texts are in Indonesian (id) and English (en)
 */

export const ORG_TEXTS = {
    // Scene 1 texts
    scene1: {
        speaker: {
            id: "Senior Bendahara",
            en: "Senior Treasurer"
        },
        dialogue: {
            id: "Dengar, dana acara kita mepet. Saya butuh kamu serahkan sebagian uang kas yang kamu pegang untuk dana taktis. Nanti laporannya gampang, kita manipulasi saja agar semuanya terlihat pas.",
            en: "Listen, our event funds are tight. I need you to hand over part of the cash you're holding for tactical funds. The report will be easy, we'll just manipulate it so everything looks right."
        },
        choices: {
            a: {
                id: "Menolak dan tetap memegang uang dengan jujur",
                en: "Refuse and keep the money honestly"
            },
            b: {
                id: "Memberikan uang dan memanipulasi laporan",
                en: "Give the money and manipulate the report"
            }
        },
        supplementMessage: {
            id: "Korupsi dalam organisasi siswa sering kali dimulai dari hal kecil seperti ini. Pilihan hari ini menentukan integritas besok.",
            en: "Corruption in student organizations often starts from small things like this. Today's choice determines tomorrow's integrity."
        }
    },

    // Scene 2A texts
    scene2a: {
        speaker: {
            id: "Senior Bendahara",
            en: "Senior Treasurer"
        },
        dialogue: {
            id: "Uang ini akan saya berikan ke Ketua OSIS. Dia yang akan menyiapkan acaranya, jadi tugas kamu lebih ringan.",
            en: "I will give this money to the Student Council President. He will prepare the event, so your task will be lighter."
        },
        choices: {
            a: {
                id: "Tetap menolak dan tidak memberikan uang",
                en: "Continue to refuse and not give the money"
            },
            b: {
                id: "Memberikan uang dan memanipulasi laporan",
                en: "Give the money and manipulate the report"
            }
        },
        supplementMessage: {
            id: "Tekanan dari atasan sering menguji batas. Bukan tentang berani melawan, tapi berani tetap jujur walau semua mendesak untuk melakukan sebaliknya.",
            en: "Pressure from superiors often tests boundaries. It's not about daring to fight back, but daring to remain honest even when everyone pushes you to do otherwise."
        }
    },

    // Scene 2B texts
    scene2b: {
        speaker: {
            id: "Pembina OSIS",
            en: "Student Council Advisor"
        },
        dialogue: {
            id: "Mengapa bendahara memberikan uang ke Ketua OSIS dan Senior? Apa yang terjadi?",
            en: "Why did the treasurer give money to the Student Council President and Senior? What happened?"
        },
        choices: {
            a: {
                id: "Jujur dan dihukum Pembina",
                en: "Be honest and face punishment from the Advisor"
            },
            b: {
                id: "Berbohong dan tidak dicurigai Pembina",
                en: "Lie and avoid suspicion from the Advisor"
            }
        },
        supplementMessage: {
            id: "Kebohongan yang menyelamatkanmu hari ini, sedang menyiapkan kebinasaan untuk besok.",
            en: "The lie that saves you today is preparing your downfall for tomorrow."
        }
    },

    // Scene 3A texts
    scene3a: {
        speaker: {
            id: "Vendor",
            en: "Vendor"
        },
        dialogue: {
            id: "Saya bisa jadi vendor kalian, tapi pakai sistem khusus: tandatangan tanpa laporan resmi. Dana bonus untuk kalian.",
            en: "I can be your vendor, but with a special system: signatures without official reports. Bonus funds for you."
        },
        choices: {
            a: {
                id: "Menolak dan di-nonaktifkan Pembina",
                en: "Refuse and be suspended by the Advisor"
            },
            b: {
                id: "Menerima dan acara berjalan lancar",
                en: "Accept and the event proceeds smoothly"
            }
        },
        supplementMessage: {
            id: "Menolak godaan berarti kehilangan kesempatan cepat — tapi menyelamatkan masa depan yang lebih berat.",
            en: "Refusing temptation means losing quick opportunities — but saving a more valuable future."
        }
    },

    // Scene 3B texts
    scene3b: {
        speaker: {
            id: "Vendor",
            en: "Vendor"
        },
        dialogue: {
            id: "Saya bisa jadi vendor kalian, tapi pakai sistem khusus: tandatangan tanpa laporan resmi. Dana bonus untuk kalian.",
            en: "I can be your vendor, but with a special system: signatures without official reports. Bonus funds for you."
        },
        choices: {
            a: {
                id: "Menolak vendor dan acara tidak berjalan",
                en: "Refuse the vendor and the event doesn't proceed"
            },
            b: {
                id: "Menerima vendor dan acara berjalan lancar",
                en: "Accept the vendor and the event proceeds smoothly"
            }
        },
        supplementMessage: {
            id: "Ketika kamu sudah terjerumus satu langkah, langkah kedua terasa lebih mudah. Itulah bahayanya.",
            en: "When you've already taken one step in, the second step feels easier. That's the danger."
        }
    },

    // Scene 4A texts
    scene4a: {
        speaker: {
            id: "Pembina OSIS",
            en: "Student Council Advisor"
        },
        dialogue: {
            id: "Kamu tidak bisa menemukan vendor? Bagaimana acara bisa berjalan? Saya perlu laporan keuangan sekarang!",
            en: "You couldn't find a vendor? How can the event proceed? I need the financial report now!"
        },
        choices: {
            a: {
                id: "Jujur tentang kekacauan keuangan organisasi",
                en: "Be honest about the organization's financial mess"
            },
            b: {
                id: "Berbohong dan memalsukan laporan keuangan",
                en: "Lie and forge the financial report"
            }
        },
        supplementMessage: {
            id: "Jujur mungkin menyakitkan sekarang, tetapi berbohong akan menyakitkan selamanya.",
            en: "Honesty may hurt now, but lying will hurt forever."
        }
    },

    // Scene 4B texts
    scene4b: {
        speaker: {
            id: "Pembina OSIS",
            en: "Student Council Advisor"
        },
        dialogue: {
            id: "Ada perlengkapan yang tidak sesuai. Saya perlu laporan keuangan sementara untuk melihat kondisi dana.",
            en: "Some equipment doesn't match. I need an interim financial report to review the fund's condition."
        },
        choices: {
            a: {
                id: "Jujur bahwa ada dana tidak resmi dari vendor",
                en: "Be honest that there are unofficial funds from the vendor"
            },
            b: {
                id: "Sembunyikan dana vendor dan manipulasi laporan",
                en: "Hide the vendor funds and manipulate the report"
            }
        },
        supplementMessage: {
            id: "Korupsi yang tersembunyi hari ini akan menjadi bom waktu yang meledak di masa depan.",
            en: "Corruption hidden today will become a time bomb that explodes in the future."
        }
    },

    // Common UI texts
    ui: {
        readConversation: {
            id: "Baca Percakapan",
            en: "Read Conversation"
        },
        clickToClose: {
            id: "Klik untuk menutup",
            en: "Click to close"
        },
        alternative: {
            id: "Alternatif",
            en: "Alternative"
        },
        supplementTitle: {
            id: "Pesan",
            en: "Message"
        }
    }
};
