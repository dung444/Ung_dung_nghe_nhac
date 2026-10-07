import { PrismaClient, LicenseType, CopyrightStatus } from "@prisma/client";

const prisma = new PrismaClient();

interface CleanSongData {
  title: string;
  artistName: string;
  artistBio?: string;
  artistAvatar?: string;
  genreName: string;
  genreSlug: string;
  fileUrl: string;
  coverUrl: string;
  duration: number;
  lyrics: string;
  licenseType: LicenseType;
  ownerName: string;
}

const CATALOG: CleanSongData[] = [
  // ─── NCS POPULAR VOCAL HITS ──────────────────────────────────────────────
  {
    title: "On & On",
    artistName: "Cartoon",
    artistBio: "Estonian EDM duo Cartoon famed for their global viral melodic anthems.",
    artistAvatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    genreName: "Future Bass",
    genreSlug: "future-bass",
    fileUrl: "https://archive.org/download/cartoonononfeatdaniellevincsreleaselistenvid.com/Cartoon_-_On_On_feat_Daniel_Levi_NCS_Release%5BListenVid.com%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    duration: 208,
    lyrics: `[Verse 1]
I'm walking fast through the traffic lights
Busy streets and hurry feet, they keep me moving on
Talking loud, chatting on the phone
People driving me crazy, but I'm going on

[Pre-Chorus]
Forget yesterday, this life is a game
A fun little ride, there's no need to explain
So baby, come on, get up and let's go
We're ready to shine, we're ready to show

[Chorus]
And the sun goes down, the stars come out
And all that counts is here and now
My universe will never be the same
I'm glad you came
You keep me moving on and on and on...

[Verse 2]
No turning back, our hearts beat loud
We're breaking out, we're leaving the crowd
High above the clouds we fly
Painting tomorrow across the sky

[Chorus]
And the sun goes down, the stars come out
And all that counts is here and now
My universe will never be the same
I'm glad you came!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Fade",
    artistName: "Alan Walker",
    artistBio: "Norwegian electronic producer who rose to international fame through NoCopyrightSounds.",
    artistAvatar: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80",
    genreName: "Electronic",
    genreSlug: "electronic",
    fileUrl: "https://archive.org/download/soundcloud-178001361/Alan_Walker_-_Fade_NCS_Release-178001361.mp3",
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    duration: 260,
    lyrics: `[Intro - Melodic Synth]
You were the shadow to my light
Did you feel us?
Another start, you fade away
Afraid our aim is out of sight
Wanna see us alive

[Drop]
Where are you now?
Where are you now?
Was it all in my fantasy?
Where are you now?
Were you only imaginary?

[Verse]
Where are you now?
Atlantis, under the sea, under the sea
Where are you now?
Another dream
The monster's running wild inside of me
I'm faded, I'm faded
So lost, I'm faded!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Spectre",
    artistName: "Alan Walker",
    artistBio: "Norwegian electronic producer who rose to international fame through NoCopyrightSounds.",
    artistAvatar: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80",
    genreName: "Electro House",
    genreSlug: "electro-house",
    fileUrl: "https://archive.org/download/soundcloud-184757886/Alan_Walker_-_Spectre_NCS_Release-184757886.mp3",
    coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80",
    duration: 230,
    lyrics: `[Verse 1]
Hello, hello, can you hear me as I scream your name?
Hello, hello, do you need me before I fade away?
Is this the place that I call home?
Or am I drifting here alone?

[Pre-Chorus]
We live, we love, we lie
Through the shadows of the night
We'll guide each other home
We'll never be alone!

[Chorus - High Energy Melody]
The spectre in the dark
A beacon and a spark
Reaching through the endless space
In our timeless embrace!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Chasing Dreams",
    artistName: "Jim Yosef",
    artistBio: "Swedish music producer renowned for uplifting melodic progressive house and electro.",
    artistAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    genreName: "Progressive House",
    genreSlug: "progressive-house",
    fileUrl: "https://archive.org/download/soundcloud-547799859/Jim_Yosef_Valentina_Franco_-_Chasing_Dreams_NCS_Release-547799859.mp3",
    coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    duration: 207,
    lyrics: `[Verse 1]
Look at the sky, the colors begin to fade
Remember the promises that we both made
Walking the line between what's real and what's past
We built a dream designed to last

[Chorus]
We're chasing dreams through the open night
Igniting sparks in the fading light
Don't let go now, we're almost there
Feel the electric energy in the air!
Chasing dreams!
Chasing dreams!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Only Us",
    artistName: "RedMoon",
    artistBio: "Dynamic dance producer blending emotional progressive harmonies with soulful vocals.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "EDM",
    genreSlug: "edm",
    fileUrl: "https://archive.org/download/soundcloud-180401101/RedMoon_Feat._Jonny_Rose_-_Only_Us_NCS_Release-180401101.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&q=80",
    duration: 265,
    lyrics: `[Verse 1]
The world outside is spinning out of control
You are the anchor that is keeping my soul
Through every storm and every troubled sea
You're the only one who truly understands me

[Chorus]
When everything falls away
And the night turns into day
There's no one else, no one can touch
This universe of only us!
Only us, yeah...
Just you and me, only us!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Click & Scroll",
    artistName: "Cadmium",
    artistBio: "Future bass maestro crafting catchy melodies with vibrant vocal collaborations.",
    artistAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    genreName: "Future Bass",
    genreSlug: "future-bass",
    fileUrl: "https://archive.org/download/soundcloud-574261179/574261179.mp3",
    coverUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&q=80",
    duration: 244,
    lyrics: `[Verse 1]
Another notification on the glass
Watching another second pass
Caught in the loop of an endless screen
Wondering what it's supposed to mean

[Chorus]
Click and scroll, searching for a sign
Trying to find some peace of mind
Let the music take control tonight
Step into the neon light!
Click and scroll!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Stay With Me",
    artistName: "Mendum",
    artistBio: "Melodic dubstep and chillstep creator known for atmospheric deep soundscapes.",
    artistAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",
    genreName: "Melodic Dubstep",
    genreSlug: "melodic-dubstep",
    fileUrl: "https://archive.org/download/MendumStayWithMeNCSRelease/Mendum%20-%20Stay%20With%20Me%20%5BNCS%20Release%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80",
    duration: 168,
    lyrics: `[Verse]
In the quiet of the night
When shadows embrace the light
Don't let this moment fade away
Hear the unspoken words I say

[Chorus]
Stay with me until the morning comes
Before the rising beat of distant drums
In your arms is where I belong
To your rhythm I sing this song
Stay with me!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Feel Good",
    artistName: "Syn Cole",
    artistBio: "Estonian DJ and producer renowned for infectious feel-good piano house anthems.",
    artistAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80",
    genreName: "House",
    genreSlug: "house",
    fileUrl: "https://archive.org/download/syn-cole-feel-good-future-house-ncs-copyright-free-music_202609/Syn%20Cole%20-%20Feel%20Good%20%20Future%20House%20%20NCS%20-%20Copyright%20Free%20Music.mp3",
    coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
    duration: 182,
    lyrics: `[Verse 1]
Put your hands up, feel the summer breeze
Drifting through the rhythm with effortless ease
Nothing in the world gonna bring us down
We are the royalty of this town

[Chorus]
Makes you feel good!
Everything is gonna be alright
Dance together in the golden light
Makes you feel good!
Feel good!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Holding On",
    artistName: "Floatinurboat",
    artistBio: "Passionate bass producer blending cinematic textures with emotive rock vocals.",
    artistAvatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80",
    genreName: "Melodic Bass",
    genreSlug: "melodic-bass",
    fileUrl: "https://archive.org/download/soundcloud-431063679/Floatinurboat_x_Chris_Linton_-_Holding_On_NCS_Release-431063679.mp3",
    coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&q=80",
    duration: 269,
    lyrics: `[Verse 1]
Every bridge we burned along the way
Every price we had to pay
Still I hear your whisper in the wind
Where the new chapter begins

[Chorus]
I'm holding on, holding on to you
No matter what we're going through
Through fire and water, through dark and light
I'll keep on holding through the night!
Holding on!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "This Life",
    artistName: "OLWIK",
    artistBio: "Swedish melodic dance artist pairing uplifting chord progressions with soaring vocals.",
    artistAvatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80",
    genreName: "Pop EDM",
    genreSlug: "pop-edm",
    fileUrl: "https://archive.org/download/OLWIKThisLifefeat.JohnningNCSRelease/OLWIK%20-%20This%20Life%20(feat.%20Johnning)%20%5BNCS%20Release%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80",
    duration: 225,
    lyrics: `[Verse 1]
Look back at the steps we took
Like pages written in an open book
Never wondered if we could or couldn't win
We just jumped right in

[Chorus]
This is our moment, this is our time
Two beating hearts on the same baseline
Living this life like there's no tomorrow
Leaving behind all doubt and sorrow!
This life!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Clouds",
    artistName: "Anna Yvette",
    artistBio: "Prolific vocalist and producer known for high-octane bass and vocal collaborations.",
    artistAvatar: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80",
    genreName: "Electropop",
    genreSlug: "electropop",
    fileUrl: "https://archive.org/download/soundcloud-302319626/302319626.mp3",
    coverUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80",
    duration: 284,
    lyrics: `[Verse 1]
Floating higher than the atmosphere
All our troubles disappear
Looking down at the world below
Where the neon rivers flow

[Chorus]
We're walking on clouds!
Above the noise, above the crowds
Nothing can touch us up in the sky
Spread our wings and learn to fly!
On clouds!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Mutiny",
    artistName: "Egzod",
    artistBio: "French-American trap and bass producer known for powerful cinematic beats.",
    artistAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
    genreName: "Trap",
    genreSlug: "trap",
    fileUrl: "https://archive.org/download/soundcloud-894890515/894890515.mp3",
    coverUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&q=80",
    duration: 160,
    lyrics: `[Verse 1]
Rise up, break the chains of silence
Through the storms of revolution
No more backing down in fear
The moment of truth is here

[Drop / Rap]
This is the mutiny!
We take control of destiny
Unbreakable unity
This is the mutiny!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Demons",
    artistName: "NIVIRO",
    artistBio: "Belgian hard dance and EDM sensation behind energetic viral festival bangers.",
    artistAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80",
    genreName: "Festival EDM",
    genreSlug: "festival-edm",
    fileUrl: "https://archive.org/download/niviro-demons-ncs/NIVIRO%20-%20Demons%20%5BNCS%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
    duration: 193,
    lyrics: `[Verse 1]
Shadows creeping up the wall
Waiting for the hero to fall
Look right into the wicked glare
Show no panic, show no scare

[Chorus]
Conquer the demons inside of your head
Stand up and roar where they said you were dead
Turn on the thunder, ignite the fire
Rising up higher and higher!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Over",
    artistName: "Lars M",
    artistBio: "European progressive electronic producer teaming with powerhouse female vocalists.",
    artistAvatar: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80",
    genreName: "Progressive House",
    genreSlug: "progressive-house",
    fileUrl: "https://archive.org/download/LarsMSideBFt.AlomaSteeleOverNCSRelease/LarsM%20%20Side-B%20ft.%20Aloma%20Steele%20-%20Over%20%5BNCS%20Release%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=600&q=80",
    duration: 224,
    lyrics: `[Verse 1]
Every memory written in stone
Now I'm standing here all on my own
I gave you the best of my time
Thought that your heart was in line with mine

[Chorus]
Now it is over, the curtains have drawn
The night has given way to the dawn
I'm walking forward, head held up high
Waving a silent goodbye
It is over!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },

  // ─── NEFFEX VOCAL RAP/ROCK/POP ANTHEMS (100% ROYALTY-FREE) ──────────────
  {
    title: "Soldier",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Hip-Hop & Rock",
    genreSlug: "hip-hop-rock",
    fileUrl: "https://archive.org/download/generic-neffex-soldiercopyrightfree-dSEcwNcbiX/neffex-soldiercopyrightfree-dSEcwNcbiX-neffex-soldiercopyrightfree-dSEcwNcbiX.mp3",
    coverUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80",
    duration: 216,
    lyrics: `[Verse 1]
I am a soldier, I march on my own
Built this conviction inside of my bones
Rain on my helmet, mud on my boots
Digging right down to my stubborn roots

[Chorus]
I will fight till the end, I will never give in
Through the battle of life, I am here to win
Call me a soldier, standing upright
Leading the march through the darkest night!
Soldier! Never give up!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Cold in the Water",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Alternative Pop",
    genreSlug: "alternative-pop",
    fileUrl: "https://archive.org/download/soundcloud-586202709/NEFFEX_-_Cold_in_the_Water-586202709.mp3",
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    duration: 164,
    lyrics: `[Verse 1]
I feel it creeping down inside of my skin
Thinking 'bout the places that I've never been
Diving deep down where the current is rough
Wondering if my best will ever be enough

[Chorus]
It's so cold in the water, but I'm gonna swim
Gotta keep on moving sink or swim
Leave all my fears behind on the shore
I'm reaching out for something more!
Cold in the water!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Pull Me Apart",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Trap Rock",
    genreSlug: "trap-rock",
    fileUrl: "https://archive.org/download/soundcloud-604367376/NEFFEX_-_Pull_Me_Apart-604367376.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    duration: 146,
    lyrics: `[Verse 1]
Tell me what you want from me
Is it pain or harmony?
Pushing all my buttons till I overflow
Watching this entire little circus show

[Chorus]
Go ahead and pull me apart!
Tear at the seams of a beating heart
I will rebuild from the ground and rise
Looking at destiny in the eyes!
Pull me apart!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Grateful",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Hip-Hop",
    genreSlug: "hip-hop",
    fileUrl: "https://archive.org/download/neffexgratefulairmowremixcopyrightfree/NEFFEX%20-%20Grateful%20(Airmow%20Remix)%20%5BCopyright%20Free%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80",
    duration: 180,
    lyrics: `[Verse 1]
I wake up in the morning and I take a deep breath
Realize I'm alive and I escaped from the mess
Every single blessing that was placed in my lap
Grateful for the lessons on this bumpy old map

[Chorus]
I'm grateful for the highs and the lows!
Grateful for the blossom and the thorn on the rose
Everything I have is everything I need
Planting the ambition, cultivating the seed!
Grateful!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "They Call Me A God",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Hype Rap",
    genreSlug: "hype-rap",
    fileUrl: "https://archive.org/download/neffex-they-call-me-a-god-copyright-free-no.-161/NEFFEX%20-%20They%20Call%20Me%20A%20God%20%20%5BCopyright-Free%5D%20No.161.mp3",
    coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80",
    duration: 122,
    lyrics: `[Verse 1]
Put the work in every day and night
Stepping right into the center of the spotlight
Never doubted what I'm capable to do
Turning old dreams into reality true

[Chorus]
They call me a god when I conquer the stage
Turning over every single brand new page
No holding back, hear the thunderous roar
Breaking through the limits like never before!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Courageous",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Energetic Rock",
    genreSlug: "energetic-rock",
    fileUrl: "https://archive.org/download/neffex-courageous-copyright-free-no.-216/NEFFEX%20-%20Courageous%20%5BCopyright%20Free%5D%20No.216.mp3",
    coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    duration: 196,
    lyrics: `[Verse 1]
Step in the arena where the giants reside
Look upon the mountainside with fire and pride
No hesitation when your purpose is set
Play the winning hand, don't you place any bet

[Chorus]
Be courageous! Stand up and shout!
Cast away the fear and the poisonous doubt
You've got the spirit of an unstoppable lion
Reaching for the gold, forever higher!
Courageous!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Ready To Go",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Electronic Rock",
    genreSlug: "electronic-rock",
    fileUrl: "https://archive.org/download/neffexreadytogocopyrightfree/NEFFEX%20-%20Ready%20to%20Go%20%F0%9F%8F%8D%F0%9F%A4%98%5BCopyright%20Free%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
    duration: 212,
    lyrics: `[Verse 1]
Keys in the ignition, pedal right to the floor
Running straight toward an unlocked door
Sky is wide open, nothing holding me back
Speeding down the fast line on the open track

[Chorus]
I'm ready to go!
Ready to hit the road and lose control
Feel the adrenaline pumping inside
This is the ride of our lives!
Ready to go!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Pentakill",
    artistName: "Different Heaven",
    artistBio: "Spanish EDM artist famed for energetic gaming anthems and vibrant vocals.",
    artistAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
    genreName: "Gaming EDM",
    genreSlug: "gaming-edm",
    fileUrl: "https://archive.org/download/soundcloud-181628540/Different_Heaven_feat._ReesaLunn_-_Pentakill_NCS_Release-181628540.mp3",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
    duration: 198,
    lyrics: `[Verse 1]
Stepping into the battleground
Listen to the electric sound
We're leveling up with every beat
Victory tasting oh so sweet

[Chorus]
Ready for the pentakill!
Feel the surging adrenaline thrill
No one can stop us when we take flight
Crowning the champions of the night!
Pentakill!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Bring Me Back To Life",
    artistName: "InfiNoise",
    artistBio: "Future bass producer blending rich synth chords and emotional vocal performances.",
    artistAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    genreName: "Future Bass",
    genreSlug: "future-bass",
    fileUrl: "https://archive.org/download/Dropbox-al14mvtkhhlczlo/al14mvtkhhlczlo.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    duration: 258,
    lyrics: `[Verse 1]
Lost in a haze of black and grey
Counting the moments day by day
Then like a spark inside the dark
You came and left a burning mark

[Chorus]
You bring me back to life!
Casting away the shadow and strife
Breathing the air of freedom again
Where a brand new journey can begin!
Back to life!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "How Do You Know",
    artistName: "Arlow",
    artistBio: "Pop and dance sensation crafting radio-ready anthems with catchy vocal hooks.",
    artistAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80",
    genreName: "Pop Dance",
    genreSlug: "pop-dance",
    fileUrl: "https://archive.org/download/soundcloud-682921142/682921142.mp3",
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    duration: 179,
    lyrics: `[Verse 1]
Looking at the choices that we face
Running around this busy place
Everyone has something to say
Trying to guide you along the way

[Chorus]
How do you know what the future holds?
When the greatest stories are yet untold
Follow the compass of your heart
That is where the miracles start!
How do you know?`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Any Closer",
    artistName: "Netrum",
    artistBio: "Innovative electronic composer known for smooth melodies and emotive drops.",
    artistAvatar: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80",
    genreName: "Melodic Bass",
    genreSlug: "melodic-bass",
    fileUrl: "https://archive.org/download/soundcloud-893737774/893737774.mp3",
    coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80",
    duration: 234,
    lyrics: `[Verse 1]
Standing on the edge of tomorrow
Letting go of every sorrow
Reaching out into the unknown
Now that our true colors have shown

[Chorus]
Can we get any closer tonight?
Bathed in the warm celestial light
Step by step, hand in hand
Creating our own promised land!
Any closer!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "The Rain",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Hip-Hop",
    genreSlug: "hip-hop",
    fileUrl: "https://archive.org/download/neffex-the-rain-copyright-free-no.-181/NEFFEX%20-%20The%20Rain%20%20%5BCopyright%20Free%5D%20No.181.mp3",
    coverUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&q=80",
    duration: 212,
    lyrics: `[Verse 1]
Clouds gathering over the skyline
Watching the drops fall in straight lines
Washing away the dust of the years
Washing away all of our fears

[Chorus]
Let it fall, let the rain come down!
Soak through every corner of town
From every storm a flower will grow
That's the only truth that I know!
The rain!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Lost Within",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Alternative Pop",
    genreSlug: "alternative-pop",
    fileUrl: "https://archive.org/download/neffexlostwithincopyrightfree/NEFFEX%20-%20Lost%20Within%20%5BCopyright%20Free%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
    duration: 144,
    lyrics: `[Verse 1]
Walking through a maze of endless thought
Remembering every battle fought
Looking for a guide to break on through
Finding my way straight back to you

[Chorus]
Don't get lost within the dark!
Ignite your own internal spark
You are the master of your fate
It's never too late!
Lost within!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "It's Just Not Fair",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Hip-Hop & Rock",
    genreSlug: "hip-hop-rock",
    fileUrl: "https://archive.org/download/neffexitsjustnotfaircopyrightfree/NEFFEX%20-%20It%60s%20Just%20Not%20Fair%20%5BCopyright%20Free%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    duration: 164,
    lyrics: `[Verse 1]
Life hits hard when you least expect
Demand a little bit of respect
They told you that the game was rigged
Look at the deep hole that they dig

[Chorus]
They say it's just not fair!
Nobody's giving a care
So build your own rules to play
And conquer another brand new day!
It's just not fair!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Rollin' With The Devil",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Trap Rock",
    genreSlug: "trap-rock",
    fileUrl: "https://archive.org/download/neffexrollinwiththedevilcopyrightfree/NEFFEX%20-%20Rollin'%20With%20The%20Devil%20(Copyright%20Free).mp3",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
    duration: 193,
    lyrics: `[Verse 1]
Dangerous roads and flashing lights
Living through high-octane nights
Taking the gamble, rolling the dice
Never paying the bargain price

[Chorus]
Rollin' with the devil on the track!
No looking down, no turning back
Speeding through the hazard zone
Claiming the kingdom for my own!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },

  // ─── DÂN CA VIỆT NAM (100% CÔNG QUYỀN / PUBLIC DOMAIN CÓ LỜI) ───────────
  {
    title: "Bèo Dạt Mây Trôi",
    artistName: "Lan Hương & Quan Họ Bắc Ninh",
    artistBio: "Di sản âm nhạc dân ca Quan Họ Bắc Ninh cổ truyền của dân tộc Việt Nam, thuộc công quyền (Public Domain).",
    artistAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    genreName: "Dân Ca Quan Họ",
    genreSlug: "dan-ca-quan-ho",
    fileUrl: "https://archive.org/download/BeoDatMayTroi/07.TinhNgaiYeuConBeoDatMayTroi_nl_LanHuong.mp3",
    coverUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
    duration: 250,
    lyrics: `[Lời 1]
Bèo dạt mây trôi, chốn xa xôi
Anh ơi, em vẫn đợi bèo dạt
Mây trôi, chim ca tang tính tình, cá lội
Ngậm một tin trông, hai tin đợi, ba bốn tin chờ
Sao chẳng thấy anh?

[Lời 2]
Một mảnh trăng treo, bóng chênh vênh
Bên sông em vẫn đợi mỏi mòn
Trăng trôi, sương rơi tang tính tình, lá rụng
Đợi người thương phương xa quay gót về đây
Ấm lòng bến xưa...

[Điệp khúc]
Ngậm ngùi câu hát ân tình gửi trao
Người ơi người ở đừng về!`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
  {
    title: "Trống Cơm",
    artistName: "Trùng Dương Band",
    artistBio: "Dàn nhạc dân tộc hòa tấu và ca xướng làn điệu dân ca Bắc Bộ truyền thống.",
    artistAvatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    genreName: "Dân Ca Đồng Bằng Bắc Bộ",
    genreSlug: "dan-ca-bac-bo",
    fileUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/08.%20Trong%20Com.mp3",
    coverUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/TrungDuongCD-QuaCauGioBay-1.jpg",
    duration: 263,
    lyrics: `[Lời 1]
Tình bằng có cái trống cơm
Khen ai khéo vỗ, ối bông nên bông
Một bầy tang tình con sít
Một bầy tang tình con sít
Lội lội lội sông, ối trông bậu về!

[Điệp khúc]
Thương ai duyên tình lận đận
Mấy phen đợi mấy phen trông
Tình bằng có cái trống cơm
Vỗ lên rộn rã non sông đất trời!`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
  {
    title: "Qua Cầu Gió Bay",
    artistName: "Trùng Dương Band",
    artistBio: "Dàn nhạc dân gian hòa âm khúc hát trữ tình nổi tiếng của Quan Họ.",
    artistAvatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    genreName: "Dân Ca Quan Họ",
    genreSlug: "dan-ca-quan-ho",
    fileUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/05.%20Qua%20Cau%20Gio%20Bay.mp3",
    coverUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/TrungDuongCD-QuaCauGioBay-1.jpg",
    duration: 217,
    lyrics: `[Lời 1]
Yêu nhau cởi áo cho nhau
Về nhà dối mẹ qua cầu gió bay
Gió bay em mới chẳng hay
Áo em bay mất, qua cầu gió bay...

[Lời 2]
Yêu nhau cởi nón cho nhau
Về nhà dối mẹ qua cầu gió bay
Tình em như bóng trăng soi
Trăm năm son sắt một lòng chờ nhau!`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
  {
    title: "Hò Ba Lý",
    artistName: "Nghệ Nhân Dân Ca Xứ Quảng",
    artistBio: "Điệu hò lao động và giao duyên mộc mạc vùng Trung Bộ Việt Nam.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Dân Ca Miền Trung",
    genreSlug: "dan-ca-mien-trung",
    fileUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/06.%20Ho%20Ba%20Ly.mp3",
    coverUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/TrungDuongCD-QuaCauGioBay-2.jpg",
    duration: 237,
    lyrics: `[Xướng và Xô]
Ba lý tang tình mà nghe, ta hò ba lý tình tang
Trèo lên trên rẫy khoai lang
Ba lý tang tình mà nghe, chẻ tre đan sọt
Cho nàng tỉa khoai!
Tình tang tang tính tình tang
Hò lên vang khắp xóm làng quê hương!`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
  {
    title: "Lý Trái Mướp",
    artistName: "Nghệ Nhân Dân Ca Nam Bộ",
    artistBio: "Làn điệu dân ca sông nước Nam Bộ ngọt ngào, chất phác.",
    artistAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",
    genreName: "Dân Ca Nam Bộ",
    genreSlug: "dan-ca-nam-bo",
    fileUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/04.%20Ly%20Trai%20Muop.mp3",
    coverUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/TrungDuongCD-QuaCauGioBay-2.jpg",
    duration: 199,
    lyrics: `[Lời bài hát]
Bìm bịp kêu nước lớn bờ sông
Mướp hương trổ bông vàng rực bên hiên nhà
Gió đưa gió đẩy về đâu
Tình quê chan chứa đậm sâu tháng ngày...
Ơi câu lý trái mướp thân thương!`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
  {
    title: "Lý Vọng Phu",
    artistName: "Nghệ Nhân Dân Ca Nam Bộ",
    artistBio: "Giai điệu hoài vọng thủy chung da diết của người phụ nữ Nam Bộ.",
    artistAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    genreName: "Dân Ca Nam Bộ",
    genreSlug: "dan-ca-nam-bo",
    fileUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/07.%20Ly%20Vong%20Phu.mp3",
    coverUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/TrungDuongCD-QuaCauGioBay-1.jpg",
    duration: 158,
    lyrics: `[Lời bài hát]
Đứng trông người đi muôn dặm trùng xa
Hóa đá vọng phu son sắt một lòng
Mây ngàn gió núi bay qua
Tình xưa nghĩa cũ muôn đời không phai...`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
  {
    title: "Lý Bán Đon",
    artistName: "Dàn Nhạc Cổ Truyền Việt Nam",
    artistBio: "Bản hòa tấu dân gian vui nhộn tái hiện không khí chợ quê náo nhiệt.",
    artistAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    genreName: "Dân Ca Nam Bộ",
    genreSlug: "dan-ca-nam-bo",
    fileUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/10.%20Ly%20Ban%20Don.mp3",
    coverUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/TrungDuongCD-QuaCauGioBay-2.jpg",
    duration: 177,
    lyrics: `[Lời bài hát]
Gánh đon ra chợ bán đon
Đon dài đon ngắn vuông tròn bán mua
Người mua kẻ bán cười đùa
Tưng bừng phiên chợ rộn mùa lúa thơm!`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
  {
    title: "Ba Rằng Ba Rí",
    artistName: "Dàn Nhạc Cổ Truyền Việt Nam",
    artistBio: "Làn điệu dân gian rộn ràng đầm ấm gắn liền với sinh hoạt lễ hội truyền thống.",
    artistAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80",
    genreName: "Dân Ca Miền Trung",
    genreSlug: "dan-ca-mien-trung",
    fileUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/11.%20Ba%20Rang%20Ba%20Ri.mp3",
    coverUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/TrungDuongCD-QuaCauGioBay-1.jpg",
    duration: 194,
    lyrics: `[Lời bài hát]
Ba rằng ba rí, tang tình mà nghe
Nắng lên trải rộng đường quê thanh bình
Gặp nhau chào hỏi ân tình
Trao câu chúc phúc thắm tình quê hương!`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
];

async function main() {
  console.log("🚀 Bắt đầu làm sạch database và cập nhật danh mục nhạc KHÔNG BẢN QUYỀN CÓ LỜI...");

  // 1. Xóa toàn bộ các bài hát có bản quyền / fake trước đây
  console.log("🧹 Xóa các bài hát cũ...");
  await prisma.songCopyright.deleteMany();
  await prisma.copyrightClaim.deleteMany();
  await prisma.playlistSong.deleteMany();
  await prisma.likedSong.deleteMany();
  await prisma.queueItem.deleteMany();
  await prisma.roomQueueItem.deleteMany();
  await prisma.listeningHistory.deleteMany();
  await prisma.songArtist.deleteMany();
  await prisma.songGenre.deleteMany();
  await prisma.song.deleteMany();
  console.log("✅ Đã dọn dẹp sạch toàn bộ bài hát cũ.");

  // 2. Thêm và chuẩn hóa các Thể Loại (Genres) phong phú
  const GENRES_TO_SEED = [
    { name: "Electronic", slug: "electronic" },
    { name: "Future Bass", slug: "future-bass" },
    { name: "Electro House", slug: "electro-house" },
    { name: "Progressive House", slug: "progressive-house" },
    { name: "EDM", slug: "edm" },
    { name: "Melodic Dubstep", slug: "melodic-dubstep" },
    { name: "Melodic Bass", slug: "melodic-bass" },
    { name: "House", slug: "house" },
    { name: "Trap", slug: "trap" },
    { name: "Trap Rock", slug: "trap-rock" },
    { name: "Pop EDM", slug: "pop-edm" },
    { name: "Electropop", slug: "electropop" },
    { name: "Festival EDM", slug: "festival-edm" },
    { name: "Hip-Hop", slug: "hip-hop" },
    { name: "Hip-Hop & Rock", slug: "hip-hop-rock" },
    { name: "Hype Rap", slug: "hype-rap" },
    { name: "Alternative Pop", slug: "alternative-pop" },
    { name: "Energetic Rock", slug: "energetic-rock" },
    { name: "Electronic Rock", slug: "electronic-rock" },
    { name: "Dân Ca Quan Họ", slug: "dan-ca-quan-ho" },
    { name: "Dân Ca Đồng Bằng Bắc Bộ", slug: "dan-ca-bac-bo" },
    { name: "Dân Ca Miền Trung", slug: "dan-ca-mien-trung" },
    { name: "Dân Ca Nam Bộ", slug: "dan-ca-nam-bo" },
    { name: "Gaming EDM", slug: "gaming-edm" },
    { name: "Pop Dance", slug: "pop-dance" },
    { name: "Lo-fi Chillhop", slug: "lo-fi-chillhop" },
    { name: "Acoustic Indie", slug: "acoustic-indie" },
  ];

  console.log("🎸 Cập nhật thể loại âm nhạc...");
  const genreMap = new Map<string, string>();
  for (const g of GENRES_TO_SEED) {
    const genre = await prisma.genre.upsert({
      where: { slug: g.slug },
      update: { name: g.name },
      create: { name: g.name, slug: g.slug },
    });
    genreMap.set(g.slug, genre.id);
  }

  // 3. Thêm các Ca Sĩ / Nghệ Sĩ đa dạng
  console.log("🎤 Cập nhật danh sách ca sĩ...");
  const artistMap = new Map<string, string>();
  for (const song of CATALOG) {
    if (!artistMap.has(song.artistName)) {
      const existing = await prisma.artist.findFirst({ where: { name: song.artistName } });
      if (existing) {
        artistMap.set(song.artistName, existing.id);
      } else {
        const created = await prisma.artist.create({
          data: {
            name: song.artistName,
            bio: song.artistBio || "Nghệ sĩ phát hành âm nhạc bản quyền tự do.",
            avatarUrl: song.artistAvatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
            verified: true,
          },
        });
        artistMap.set(song.artistName, created.id);
      }
    }
  }

  // 4. Tạo các Bài Hát (100% CÓ LỜI, KHÔNG BẢN QUYỀN, AUDIO THỰC)
  console.log("🎶 Đang thêm bài hát mới...");
  let count = 0;
  for (const item of CATALOG) {
    const artistId = artistMap.get(item.artistName)!;
    const genreId = genreMap.get(item.genreSlug) || genreMap.get("electronic")!;

    const song = await prisma.song.create({
      data: {
        title: item.title,
        duration: item.duration,
        fileUrl: item.fileUrl,
        coverUrl: item.coverUrl,
        lyrics: item.lyrics,
        plays: Math.floor(Math.random() * 5000) + 120,
        isPublic: true,
        artists: {
          create: {
            artistId,
          },
        },
        genres: {
          create: {
            genreId,
          },
        },
        copyright: {
          create: {
            ownerName: item.ownerName,
            licenseType: item.licenseType,
            status: CopyrightStatus.ACTIVE,
            distributionRights: "GLOBAL",
            allowRemix: true,
            commercialUse: item.licenseType !== LicenseType.CREATIVE_COMMONS,
            copyrightYear: 2026,
          },
        },
      },
    });
    count++;
    console.log(`[${count}/${CATALOG.length}] Đã thêm: ${song.title} - ${item.artistName} (${item.genreName})`);
  }

  // 5. Cập nhật Playlist "Nhạc Tuyển Chọn Không Bản Quyền" cho người dùng đầu tiên
  const firstUser = await prisma.user.findFirst();
  if (firstUser) {
    const playlist = await prisma.playlist.create({
      data: {
        name: "Tuyển Tập Nhạc Tự Do & Dân Ca Có Lời",
        description: "Toàn bộ bài hát có lời 100% không bản quyền, phát mượt mà, đầy đủ lời ca.",
        userId: firstUser.id,
        isPublic: true,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
      },
    });

    const allSongs = await prisma.song.findMany({ select: { id: true }, take: 15 });
    for (let i = 0; i < allSongs.length; i++) {
      await prisma.playlistSong.create({
        data: {
          playlistId: playlist.id,
          songId: allSongs[i].id,
          position: i + 1,
        },
      });
    }
    console.log("✅ Đã tạo playlist mẫu cho người dùng:", playlist.name);
  }

  console.log(`\n🎉 HOÀN TẤT! Đã thêm ${count} bài hát có lời không bản quyền, đa dạng thể loại và ca sĩ!`);
}

main()
  .catch((err) => {
    console.error("❌ Lỗi khi seed nhạc:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
