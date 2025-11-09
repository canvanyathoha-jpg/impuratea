// OPTIMIZATION: Shared assets that are used across multiple scenes
// These will be loaded once and reused across all scenes
const SHARED_ASSETS = [
    {
        name: "male",
        type: "glbModel",
        path: "/models/asian_male_animated.glb",
        shared: true,
    },
    {
        name: "female",
        type: "glbModel",
        path: "/models/asian_female_animated.glb",
        shared: true,
    },
    {
        name: "collider",
        type: "glbModel",
        path: "/models/collider.glb",
        shared: true,
    },
    {
        name: "environment",
        type: "cubeTexture",
        path: [
            "textures/environment/px.png",
            "textures/environment/nx.png",
            "textures/environment/py.png",
            "textures/environment/ny.png",
            "textures/environment/pz.png",
            "textures/environment/nz.png",
        ],
        shared: true,
    },
    {
        name: "video",
        type: "videoTexture",
        path: "/videos/tour.mp4",
        shared: true,
    },
];

export default [
    {
        // Shared assets loaded once at startup
        _shared: {
            assets: SHARED_ASSETS,
        },
        westgate: {
            assets: [
                {
                    name: "school",
                    type: "glbModel",
                    path: "/models/schooll.glb",
                },
            ],
        },
        class: {
            assets: [
                {
                    name: "class",
                    type: "glbModel",
                    path: "/models/Kelas-C.glb",
                },
            ],
        },
        a_scene1: {
            assets: [
                {
                    name: "class",
                    type: "glbModel",
                    path: "/models/Kelas-C.glb?v=" + Date.now(),
                },
                {
                    name: "teacher",
                    type: "glbModel",
                    path: "/models/teacher.glb",
                },
            ],
        },
        a_scene2a: {
            assets: [
                {
                    name: "class",
                    type: "glbModel",
                    path: "/models/Kelas-C.glb",
                },
                {
                    name: "guru",
                    type: "glbModel",
                    path: "/models/guru.glb",
                },
            ],
        },
        a_scene2b: {
            assets: [
                {
                    name: "class",
                    type: "glbModel",
                    path: "/models/Kelas-C.glb",
                },
                {
                    name: "teacher",
                    type: "glbModel",
                    path: "/models/teacher.glb",
                },
            ],
        },
        og_scene1: {
            assets: [
                {
                    name: "organization",
                    type: "glbModel",
                    path: "/models/ruangan_osis.glb",
                },
                {
                    name: "npc",
                    type: "glbModel",
                    path: "/models/npc.glb",
                },
            ],
        },
        scienceRoom: {
            assets: [
                {
                    name: "scienceRoom",
                    type: "glbModel",
                    path: "/models/science_room.glb",
                },
            ],
        },
        a_scene3a: {
            assets: [
                {
                    name: "scienceRoom",
                    type: "glbModel",
                    path: "/models/science_room.glb",
                },
                {
                    name: "teacher",
                    type: "glbModel",
                    path: "/models/teacher.glb",
                },
            ],
        },
        a_scene3b: {
            assets: [
                {
                    name: "scienceRoom",
                    type: "glbModel",
                    path: "/models/science_room.glb",
                },
                {
                    name: "teacher",
                    type: "glbModel",
                    path: "/models/teacher.glb",
                },
            ],
        },
        a_scene4a: {
            assets: [
                {
                    name: "class",
                    type: "glbModel",
                    path: "/models/Kelas-C.glb",
                },
                {
                    name: "teacher",
                    type: "glbModel",
                    path: "/models/teacher.glb",
                },
            ],
        },
        a_scene4b: {
            assets: [
                {
                    name: "class",
                    type: "glbModel",
                    path: "/models/Kelas-C.glb",
                },
                {
                    name: "teacher",
                    type: "glbModel",
                    path: "/models/teacher.glb",
                },
            ],
        },
        og_scene2a: {
            assets: [
                {
                    name: "organization",
                    type: "glbModel",
                    path: "/models/ruangan_osis.glb",
                },
                {
                    name: "npc",
                    type: "glbModel",
                    path: "/models/npc.glb",
                },
            ],
        },
        og_scene2b: {
            assets: [
                {
                    name: "organization",
                    type: "glbModel",
                    path: "/models/ruangan_osis.glb",
                },
                {
                    name: "npc",
                    type: "glbModel",
                    path: "/models/npc.glb",
                },
            ],
        },
        og_scene3a: {
            assets: [
                {
                    name: "caffe",
                    type: "glbModel",
                    path: "/models/caffe.glb",
                },
                {
                    name: "bos_caffe",
                    type: "glbModel",
                    path: "/models/bos_caffe.glb",
                },
            ],
        },
        og_scene3b: {
            assets: [
                {
                    name: "caffe",
                    type: "glbModel",
                    path: "/models/caffe.glb",
                },
                {
                    name: "bos_caffe",
                    type: "glbModel",
                    path: "/models/bos_caffe.glb",
                },
            ],
        },
        og_scene4a: {
            assets: [
                {
                    name: "ruangguru",
                    type: "glbModel",
                    path: "/models/Ruang_Guru.glb",
                },
                {
                    name: "guru",
                    type: "glbModel",
                    path: "/models/guru.glb",
                },
            ],
        },
        og_scene4b: {
            assets: [
                {
                    name: "ruangguru",
                    type: "glbModel",
                    path: "/models/Ruang_Guru.glb",
                },
                {
                    name: "guru",
                    type: "glbModel",
                    path: "/models/guru.glb",
                },
            ],
        },
    },
];
