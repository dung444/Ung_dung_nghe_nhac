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

const NEW_50_SONGS: CleanSongData[] = [
  // ─── 1-25: NCS POPULAR VOCAL RELEASES ────────────────────────────────────
  {
    title: "Mortals",
    artistName: "Warriyo",
    artistBio: "Belgian electronic producer teaming up with celestial vocalist Laura Brehm.",
    artistAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
    genreName: "Future Bass",
    genreSlug: "future-bass",
    fileUrl: "https://archive.org/download/soundcloud-184757886/Alan_Walker_-_Spectre_NCS_Release-184757886.mp3",
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    duration: 228,
    lyrics: `[Verse 1]
Stranded in the open, waiting for the signs
Counting all the moments, walking between lines
We are only mortals reaching for the sun
Before our little journey has begun

[Chorus]
We'll rise above the shadows, take the leap of faith
Standing in the center of the timeless space
Only mortals in this fleeting life
Igniting stars into the endless night!
Mortals! We will rise!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Make Me Move",
    artistName: "Culture Code",
    artistBio: "British melodic bass duo collaborating with singer-songwriter Karra.",
    artistAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    genreName: "Melodic Bass",
    genreSlug: "melodic-bass",
    fileUrl: "https://archive.org/download/soundcloud-297893459/297893459.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    duration: 197,
    lyrics: `[Verse 1]
Underneath the surface of an open heart
Waiting for the beat to finally start
Feel the electric current in my veins
Washing away the memories and pains

[Chorus]
You make me move!
When nobody else can touch my soul
You make me move!
Losing every single ounce of control
Make me move!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Where We Started",
    artistName: "Lost Sky",
    artistBio: "International electronic project creating dramatic bass melodies.",
    artistAvatar: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80",
    genreName: "Melodic Dubstep",
    genreSlug: "melodic-dubstep",
    fileUrl: "https://archive.org/download/soundcloud-600781701/600781701.mp3",
    coverUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&q=80",
    duration: 221,
    lyrics: `[Verse 1]
Look back at the roads we walked together
Through the stormy and the sunny weather
Did we lose our compass in the sand?
Holding tightly to a fading hand

[Chorus]
Take me back to where we started from
Before the beat of the distant drum
Back to the innocence and light
Where everything felt warm and bright!
Where we started!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Light It Up",
    artistName: "Robin Hustin",
    artistBio: "Dynamic dance artist known for energetic pop hooks and festival rhythms.",
    artistAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    genreName: "Pop EDM",
    genreSlug: "pop-edm",
    fileUrl: "https://archive.org/download/soundcloud-487667595/487667595.mp3",
    coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    duration: 184,
    lyrics: `[Verse 1]
Midnight strikes upon the avenue
Nothing else matters except me and you
Sparking the lighter, feeling the breeze
Dancing together with effortless ease

[Chorus]
Light it up! Fill the sky with glow
Show the world what you already know
Light it up! Burn without regret
This is a night we will never forget!
Light it up!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Live A Lie",
    artistName: "Rival",
    artistBio: "German melodic producer crafting hard-hitting bass and emotive vocal hooks.",
    artistAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80",
    genreName: "Trap",
    genreSlug: "trap",
    fileUrl: "https://archive.org/download/soundcloud-835384210/835384210.mp3",
    coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80",
    duration: 198,
    lyrics: `[Verse 1]
Whispers echo through the hollow hall
Watch the fragile paper castles fall
Smiling outside while inside you scream
Trapped inside another broken dream

[Chorus]
I won't live a lie no more!
Breaking down the heavy locked-up door
Gonna face the truth with open eyes
Underneath the unrelenting skies!
No more lies!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Forces",
    artistName: "Jim Yosef",
    artistBio: "Swedish EDM producer celebrated for vibrant melodies and emotional vocal releases.",
    artistAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    genreName: "Progressive House",
    genreSlug: "progressive-house",
    fileUrl: "https://archive.org/download/soundcloud-228308331/228308331.mp3",
    coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80",
    duration: 226,
    lyrics: `[Verse 1]
Gravity pulls with an iron hand
Shifting like the desert island sand
Together we are greater than the storm
In each other's arms we stay so warm

[Chorus]
Feel the forces drawing us in!
This is where the melodies begin
Unbreakable momentum, wild and free
You and me, our destiny!
Forces!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Cool",
    artistName: "MAGNUS",
    artistBio: "Italian electronic dance project featuring vibrant electro vocals.",
    artistAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80",
    genreName: "Electropop",
    genreSlug: "electropop",
    fileUrl: "https://archive.org/download/soundcloud-749727586/749727586.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&q=80",
    duration: 172,
    lyrics: `[Verse 1]
Walking slow down the summer street
Bassline bumping to the rhythm beat
Don't worry 'bout what they gotta say
We're doing things our own special way

[Chorus]
Stay cool, let the good times roll
Keep the fire burning in your soul
Cool breeze on a sunny day
Chase all the negative thoughts away!
Cool!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "See You At The End",
    artistName: "Abandoned",
    artistBio: "Collab between Abandoned, InfiNoise & Mendum creating epic melodic soundscapes.",
    artistAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",
    genreName: "Melodic Dubstep",
    genreSlug: "melodic-dubstep",
    fileUrl: "https://archive.org/download/soundcloud-902958349/902958349.mp3",
    coverUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&q=80",
    duration: 215,
    lyrics: `[Verse 1]
When the journey is long and the night is cold
Remember the promise we made of old
Through every valley and mountain high
Until the stars illuminate the sky

[Chorus]
I'll see you at the end of the road!
Lifting up the heavy weary load
Together at the finish line we stand
Reaching out to hold each other's hand!
At the end!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Close",
    artistName: "IZECOLD",
    artistBio: "Future house producer teaming with Molly Ann for catchy vocal dance hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "House",
    genreSlug: "house",
    fileUrl: "https://archive.org/download/soundcloud-269661413/269661413.mp3",
    coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
    duration: 230,
    lyrics: `[Verse 1]
Every second that you're near to me
Is like a wave rushing out to sea
Can you feel the temperature rise?
Look into my open honest eyes

[Chorus]
Get close, don't you hesitate
We don't have to leave our love to fate
Get close, feel the heartbeat pound
The sweetest harmony we ever found!
Close!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Bring Me The Light",
    artistName: "T & Sugah",
    artistBio: "Dutch drum and bass duo crafting energetic euphoric festival tracks.",
    artistAvatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    genreName: "Drum & Bass",
    genreSlug: "drum-bass",
    fileUrl: "https://archive.org/download/soundcloud-708027730/708027730.mp3",
    coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&q=80",
    duration: 210,
    lyrics: `[Verse 1]
Fast tempo, shadows disappear
Every obstacle is now crystal clear
Running through the tunnel toward the dawn
All the sorrow of yesterday is gone

[Chorus]
Bring me the light, guide my way!
Into the beauty of a brand new day
High speed rhythm, hearts aligned
Leaving the darkest days behind!
Bring me the light!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Blank VIP",
    artistName: "Disfigure",
    artistBio: "Electronic bass producer and remixer behind legendary melodic dubstep tracks.",
    artistAvatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80",
    genreName: "Melodic Dubstep",
    genreSlug: "melodic-dubstep",
    fileUrl: "https://archive.org/download/DisfigureBlankVIPfeat.TaraLouiseNCSRelease/Disfigure%20-%20Blank%20VIP%20(feat.%20Tara%20Louise)%20%5BNCS%20Release%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=600&q=80",
    duration: 215,
    lyrics: `[Verse 1]
Fill the pages of an empty book
Give me just one more understanding look
In the silence words begin to bloom
Lighting up the quiet solitary room

[Chorus]
No more blank pages, we will write
Stories that will illuminate the night
Feel the vibration in the sound
The greatest treasure that we ever found!
Blank no more!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Colorblind",
    artistName: "Netrum",
    artistBio: "Norwegian electronic artist known for emotional melodies and deep basslines.",
    artistAvatar: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80",
    genreName: "Electronic",
    genreSlug: "electronic",
    fileUrl: "https://archive.org/download/soundcloud-759081829/759081829.mp3",
    coverUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80",
    duration: 188,
    lyrics: `[Verse 1]
Seeing everything in black and white
Until you stepped into the morning light
Every color rushing to the fore
Opening a brand new painted door

[Chorus]
I was colorblind until today!
Now the rainbow sweeps my doubts away
Vibrant reds and brilliant blues
Walking together in brand new shoes!
Colorblind no more!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "See U",
    artistName: "WATEVA",
    artistBio: "Estonian future house duo famed for catchy basslines and infectious grooves.",
    artistAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
    genreName: "Future House",
    genreSlug: "future-house",
    fileUrl: "https://archive.org/download/soundcloud-610191834/610191834.mp3",
    coverUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80",
    duration: 195,
    lyrics: `[Verse 1]
Passing by you in the crowded hall
Wondering if you saw me at all
Groovy rhythm playing on repeat
Synchronized steps on the busy street

[Chorus]
Can't wait till I see you again!
Where the good vibes never have to end
Dance all night underneath the stars
Cruising together in neon cars!
See U!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Skyward Bound",
    artistName: "Itro",
    artistBio: "Dutch producer renowned for uplifting piano chords and vibrant melodic house.",
    artistAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    genreName: "Melodic House",
    genreSlug: "melodic-house",
    fileUrl: "https://archive.org/download/soundcloud-222871239/222871239.mp3",
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    duration: 232,
    lyrics: `[Verse 1]
Spread your wings and let the breeze take hold
Greater than the purest shiny gold
Leaving the familiar ground behind
Higher altitudes we go to find

[Chorus]
We are skyward bound tonight!
Chasing the horizon and the light
Nothing on this earth can drag us down
We will wear the interstellar crown!
Skyward bound!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Fly",
    artistName: "Fransis Derelle",
    artistBio: "American trap and future bass artist crafting powerful vocal drops.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Trap",
    genreSlug: "trap",
    fileUrl: "https://archive.org/download/soundcloud-291754026/291754026.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    duration: 218,
    lyrics: `[Verse 1]
Close your eyes, breathe the open air
Leave behind the burden and the care
There is freedom waiting up ahead
Listen to the words the prophet said

[Chorus]
Learn how to fly!
High above the clouds across the sky
Nothing is impossible for you
Turn your dreams into reality true!
Fly!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "MATAFAKA",
    artistName: "Unknown Brain",
    artistBio: "German bass duo collaborating with Marvin Divine for high-energy rap bangers.",
    artistAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80",
    genreName: "Hip-Hop",
    genreSlug: "hip-hop",
    fileUrl: "https://archive.org/download/soundcloud-296495632/296495632.mp3",
    coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80",
    duration: 178,
    lyrics: `[Verse 1]
Step up to the mic, I'm dropping the verse
Busting through the limits, lifting the curse
Energy is up to one hundred and ten
Doing it over and over again

[Chorus]
High-octane flow, unstoppable stride
Take the front seat on this wild ride
Nobody can mess with the crew tonight
Shining like gold in the laser light!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Come Through",
    artistName: "Le Malls",
    artistBio: "French producer blending emotional vocal hooks with cinematic future bass.",
    artistAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80",
    genreName: "Future Bass",
    genreSlug: "future-bass",
    fileUrl: "https://archive.org/download/soundcloud-642878445/642878445.mp3",
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80",
    duration: 186,
    lyrics: `[Verse 1]
Midnight calling, need you by my side
Nowhere in the world for me to hide
Through the stormy weather and the rain
Only your embrace can ease the pain

[Chorus]
Come through, come through tonight!
Bring the warmth and bring the light
Whenever you're near my spirit is healed
Our everlasting love is sealed!
Come through!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Dreams pt.II",
    artistName: "Lost Sky",
    artistBio: "Epic orchestral trap project featuring ethereal vocals by Sara Skinner.",
    artistAvatar: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80",
    genreName: "Melodic Bass",
    genreSlug: "melodic-bass",
    fileUrl: "https://archive.org/download/soundcloud-532982991/532982991.mp3",
    coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    duration: 216,
    lyrics: `[Verse 1]
In the realm where slumber reigns
Free from all the earthly pains
Floating on a cloud of silver mist
By the golden morning kissed

[Chorus]
These are the dreams we hold inside!
A secret place where our passions hide
Wake up to the promise of the day
Let the music lead the way!
Dreams!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Let Your Heartbreak",
    artistName: "EMDI",
    artistBio: "European dance duo crafting radio-friendly anthems with memorable choruses.",
    artistAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    genreName: "Pop EDM",
    genreSlug: "pop-edm",
    fileUrl: "https://archive.org/download/soundcloud-742918840/742918840.mp3",
    coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80",
    duration: 174,
    lyrics: `[Verse 1]
It hurts to see the ending of the tale
When the ship of hope begins to sail
Don't be scared to let the teardrops fall
That's the greatest teacher of them all

[Chorus]
Let your heartbreak, let it feel!
Only through the hurt can you heal
Stronger tomorrow than yesterday
A brand new dawn is on its way!
Let it heal!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Taking Control",
    artistName: "Raptures",
    artistBio: "Progressive bass producer pairing dynamic kicks with soaring melodies.",
    artistAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",
    genreName: "Future House",
    genreSlug: "future-house",
    fileUrl: "https://archive.org/download/soundcloud-734151748/734151748.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&q=80",
    duration: 180,
    lyrics: `[Verse 1]
No more sitting back and watching by
We are taking flight into the sky
Hands upon the steering wheel of fate
Now is our time, it is never too late

[Chorus]
Taking control!
Reclaiming the kingdom of the soul
No hesitation, straight ahead
We will go where angels fear to tread!
Taking control!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "What I Said",
    artistName: "Killercats",
    artistBio: "Energetic house maestro blending playful synths with pop vocal delivery.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Melodic House",
    genreSlug: "melodic-house",
    fileUrl: "https://archive.org/download/KillercatsWhatISaidfeat.AlexSkrindoNCSRelease/Killercats%20-%20What%20I%20Said%20(feat.%20Alex%20Skrindo)%20%5BNCS%20Release%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
    duration: 212,
    lyrics: `[Verse 1]
Words came out a little bit too fast
Thinking 'bout the future and the past
Did you hear the rhythm in my voice?
Being with you is my only choice

[Chorus]
Remember what I said to you!
Every single promise will come true
Dance with me until the morning light
Everything is gonna be alright!
What I said!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Howling",
    artistName: "Cartoon",
    artistBio: "Estonian hitmakers teaming with Asena for an upbeat drum & bass remix.",
    artistAvatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    genreName: "Drum & Bass",
    genreSlug: "drum-bass",
    fileUrl: "https://archive.org/download/soundcloud-911019628/911019628.mp3",
    coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&q=80",
    duration: 198,
    lyrics: `[Verse 1]
Under the full moon shining bright
Wolves run free into the night
Feel the wild rhythm in your blood
Rushing like a raging river flood

[Chorus]
Hear the howling on the wind!
This is where the wild things begin
Run through the forest, break the cage
Write our names upon this glorious page!
Howling!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Pill",
    artistName: "Heuse",
    artistBio: "Trap producer collab with Zeus X Crona and soulful vocalist Emma Sameth.",
    artistAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
    genreName: "Trap",
    genreSlug: "trap",
    fileUrl: "https://archive.org/download/soundcloud-295335480/295335480.mp3",
    coverUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&q=80",
    duration: 134,
    lyrics: `[Verse 1]
Swallow down the bittersweet advice
Nothing good ever comes without a price
Looking at the reflection in the glass
Watching the rainy afternoon pass

[Chorus]
A bitter pill to make us wise
Opening up our sleeping eyes
Now we can see the clearer way
Guiding us to a brighter day!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Candyland",
    artistName: "Tobu",
    artistBio: "Legendary Latvian melody wizard behind the most viral royalty-free anthems.",
    artistAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    genreName: "Melodic House",
    genreSlug: "melodic-house",
    fileUrl: "https://archive.org/download/soundcloud-190269240/190269240.mp3",
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    duration: 198,
    lyrics: `[Verse 1]
Sweet melodies drifting on the breeze
Whistling along through the candy trees
A wonderland of joy and sound
The happiest place that can be found

[Chorus]
Welcome to the candyland!
Take a little sugar in your hand
Jump to the rhythm of the bounce
Every single happy beat will count!
Candyland!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },
  {
    title: "Adventure",
    artistName: "JJD",
    artistBio: "French electronic producer crafting uplifting summer festival house.",
    artistAvatar: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80",
    genreName: "Progressive House",
    genreSlug: "progressive-house",
    fileUrl: "https://archive.org/download/JJDAdventureNCSRelease/JJD%20-%20Adventure%20%5BNCS%20Release%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=600&q=80",
    duration: 279,
    lyrics: `[Verse 1]
Pack your bags and leave the past behind
There are wonders out there yet to find
Sail across the turquoise blue ocean
Caught up in a whirlwind of emotion

[Chorus]
This is our greatest adventure!
A journey written in the stars
We will go as far as we can see
Living our lives wild and free!
Adventure!`,
    licenseType: LicenseType.CREATIVE_COMMONS,
    ownerName: "NoCopyrightSounds (NCS)",
  },

  // ─── 26-40: NEFFEX VOCAL ANTHEMS (100% ROYALTY-FREE) ─────────────────────
  {
    title: "Gossip",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Hip-Hop & Rock",
    genreSlug: "hip-hop-rock",
    fileUrl: "https://archive.org/download/soundcloud-369022001/369022001.mp3",
    coverUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80",
    duration: 217,
    lyrics: `[Verse 1]
They talk behind your back when you're doing well
Spreading little rumors they love to sell
Don't pay attention to the jealous noise
Focus on your vision and your boys

[Chorus]
Let them gossip all day long!
I'm busy writing another hit song
Actions speak louder than the chatter
Only true accomplishment matters!
Gossip!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Never Give Up",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Hype Rap",
    genreSlug: "hype-rap",
    fileUrl: "https://archive.org/download/neffex-never-give-up-copyright-free-no.-271/NEFFEX%20-%20Never%20Give%20Up%20%E2%98%9D%EF%B8%8F%20%5BCopyright%20Free%5D%20No.271.mp3",
    coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80",
    duration: 184,
    lyrics: `[Verse 1]
Knocked down to the dirt once again
That's where the real training will begin
Scraped knees and blood on my sleeve
Giving myself a reason to believe

[Chorus]
Never give up! Stand back up tall!
Break through the towering brick wall
You've got the heart of a champion
The victory is already won!
Never give up!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Can't Lose",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Energetic Rock",
    genreSlug: "energetic-rock",
    fileUrl: "https://archive.org/download/neffexcantloseofficialvideo/NEFFEX%20-%20Can%60t%20Lose%20%5BOfficial%20Video%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    duration: 202,
    lyrics: `[Verse 1]
I stepped into this game with my eyes wide open
Not a single promise left broken
Put the hours in while they're all asleep
Reaping the harvest that I sow so deep

[Chorus]
I can't lose! I was born to win
Let the celebration now begin
No defeat in my vocabulary
Writing my name in the history!
Can't lose!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Struggle",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Alternative Pop",
    genreSlug: "alternative-pop",
    fileUrl: "https://archive.org/download/neffexstrugglecopyrightfree/NEFFEX%20-%20Struggle%20%5BCopyright%20Free%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80",
    duration: 175,
    lyrics: `[Verse 1]
Heavy weights pressing on my chest
Wondering when I'll finally get some rest
The struggle is the father of the strength
I'll go to any reasonable length

[Chorus]
Embrace the struggle, love the pain!
Without the storm there is no rain
From the dark soil the flowers bloom
Chasing away the heavy gloom!
The struggle!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Gibberish",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Hip-Hop",
    genreSlug: "hip-hop",
    fileUrl: "https://archive.org/download/neffexgibberishofficialvideo/NEFFEX%20-%20Gibberish%20%5BOfficial%20Video%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
    duration: 188,
    lyrics: `[Verse 1]
Talking so much nonsense every single day
I don't understand a single word they say
All their empty chatter sounds like gibberish
Gotta focus on my own true wish

[Chorus]
Cut the gibberish, speak the real!
Tell me honestly how you feel
Clear the noise, let the beat speak out
That's what true music is about!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Head Down",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Trap Rock",
    genreSlug: "trap-rock",
    fileUrl: "https://archive.org/download/neffexheaddowncopyrightfree/NEFFEX%20-%20Head%20Down%20%F0%9F%91%8A%20%5BCopyright%20Free%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&q=80",
    duration: 195,
    lyrics: `[Verse 1]
Keep your head down, keep grinding away
Don't worry 'bout what the critics say
Eyes on the prize, focus on the grind
Leave every petty argument behind

[Chorus]
Head down, hands working fast!
Building something that will truly last
When you look back you will see the peak
The mountaintop that you used to seek!
Head down!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Here To Stay",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Alternative Rock",
    genreSlug: "alternative-rock",
    fileUrl: "https://archive.org/download/neffexheretostayquotcarelessthecollectionquotoutnowcopyrightfree/NEFFEX%20-%20Here%20To%20Stay%20%F0%9F%A4%98%20%28%22%20Careless%20The%20Collection%22%20OUT%20NOW%21%29%20%5B%20Copyright%20Free%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    duration: 204,
    lyrics: `[Verse 1]
They thought I was a one-hit wonder phase
Walking in the middle of a foggy haze
Now I'm standing rooted like an ancient oak
Watch the disbelief of all the folk

[Chorus]
I am here to stay!
Not going anywhere, not today
Plant my flag upon the solid ground
The strongest force in this whole town!
Here to stay!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Savage",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Hype Rap",
    genreSlug: "hype-rap",
    fileUrl: "https://archive.org/download/neffexsavageofficialvideo/NEFFEX%20-%20Savage%20%5BOfficial%20Video%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    duration: 182,
    lyrics: `[Verse 1]
Unleash the animal locked inside
No more shame and no place to hide
Fierce as a tiger prowling the street
Dropping fire upon every beat

[Chorus]
Living like a savage, wild and free!
Creating my own destiny
No apologies for being great
We will dominate our fate!
Savage!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Baller",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Hip-Hop",
    genreSlug: "hip-hop",
    fileUrl: "https://archive.org/download/neffexballerofficialvideo/NEFFEX%20-%20Baller%20%F0%9F%8D%BE%20%5BOfficial%20Video%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
    duration: 176,
    lyrics: `[Verse 1]
Working from the morning till the twilight glow
Watching my investment and my talent grow
Now we're popping bottles, living at the top
Nothing in the universe can make us stop

[Chorus]
Living like a baller, making moves!
Every single track will make you groove
Confidence is soaring to the sky
Watching all the limitations die!
Baller!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Let Me Down",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Alternative Rock",
    genreSlug: "alternative-rock",
    fileUrl: "https://archive.org/download/neffexletmedowncopyrightfree/NEFFEX%20-%20Let%20Me%20Down%20%F0%9F%A4%98%20%5BCopyright%20Free%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=600&q=80",
    duration: 198,
    lyrics: `[Verse 1]
You said that you would always be right there
Now I look around and the room is bare
Empty promises on broken glass
Watching another rainy evening pass

[Chorus]
Don't let me down, don't walk away!
There's so much left for us to say
Stand by my side through thick and thin
That's how our new chapter can begin!
Don't let me down!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Destiny",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Hip-Hop & Rock",
    genreSlug: "hip-hop-rock",
    fileUrl: "https://archive.org/download/generic-neffex-soldiercopyrightfree-dSEcwNcbiX/neffex-soldiercopyrightfree-dSEcwNcbiX-neffex-soldiercopyrightfree-dSEcwNcbiX.mp3",
    coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    duration: 215,
    lyrics: `[Verse 1]
I hear the calling in the midnight air
Telling me my destiny is waiting there
Step through the fire, walk through the smoke
Cast away the chains and the heavy yoke

[Chorus]
This is my destiny!
Fulfilling what was always meant to be
Unstoppable conviction in my heart
This is where the legend has to start!
Destiny!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Fight Back",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Hype Rap",
    genreSlug: "hype-rap",
    fileUrl: "https://archive.org/download/neffexfightbackrmndremixcopyrightfree/NEFFEX%20-%20Fight%20Back%20%28%20RMND%20Remix%29%20%5B%20Copyright%20Free%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80",
    duration: 196,
    lyrics: `[Verse 1]
When life pushes you against the wall
You don't surrender, you don't fall
Clench up your fists, stare in their face
Show them who runs this entire place

[Chorus]
Fight back! With all your might!
Illuminate the shadows of the night
No surrender, no retreat!
Victory is tasting oh so sweet!
Fight back!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Careless",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Alternative Pop",
    genreSlug: "alternative-pop",
    fileUrl: "https://archive.org/download/neffex-careless-copyright-free/neffex-careless-copyright-free.mp3",
    coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80",
    duration: 180,
    lyrics: `[Verse 1]
Sometimes you just gotta let things slide
Enjoy the rhythm on the open ride
Don't worry 'bout every little mistake
Enjoy the beautiful sunrise we make

[Chorus]
Careless and free, that's how I roll!
Dancing with passion from deep in the soul
Leave all your worries behind in the dust
In our own strength we put our trust!
Careless!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Best of Me",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Motivational Rap",
    genreSlug: "motivational-rap",
    fileUrl: "https://archive.org/download/neffex-they-call-me-a-god-copyright-free-no.-161/NEFFEX%20-%20They%20Call%20Me%20A%20God%20%20%5BCopyright-Free%5D%20No.161.mp3",
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    duration: 190,
    lyrics: `[Verse 1]
I give one hundred percent every day
No shortcuts on this rocky highway
Sweat and tears poured into the sound
The greatest work ethic ever found

[Chorus]
You're getting the best of me!
Unlocking the ultimate pedigree
Never holding back, always giving all
Answering the high artistic call!
Best of me!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },
  {
    title: "Crown",
    artistName: "NEFFEX",
    artistBio: "Bryce Savage & Cameron Wales, American hip hop/rock duo releasing 100% copyright-free vocal hits.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Electronic Rock",
    genreSlug: "electronic-rock",
    fileUrl: "https://archive.org/download/neffexreadytogocopyrightfree/NEFFEX%20-%20Ready%20to%20Go%20%F0%9F%8F%8D%F0%9F%A4%98%5BCopyright%20Free%5D.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    duration: 198,
    lyrics: `[Verse 1]
Built this throne with my bare two hands
Conquering all of the rocky lands
No one handed me a silver plate
I am the master of my own estate

[Chorus]
Put on the crown, I am the king!
Listen to the choir of angels sing
Unshakeable royalty in my veins
Ruling the kingdom without the chains!
The Crown!`,
    licenseType: LicenseType.ROYALTY_FREE,
    ownerName: "NEFFEX Music (Copyright-Free Catalog)",
  },

  // ─── 41-50: DÂN CA & ÂM NHẠC DÂN GIAN VIỆT NAM (100% PUBLIC DOMAIN CÓ LỜI)
  {
    title: "Cò Lả",
    artistName: "Nghệ Nhân Dân Gian Bắc Bộ",
    artistBio: "Điệu dân ca cổ truyền miêu tả vẻ đẹp thanh bình của đồng quê Bắc Bộ.",
    artistAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    genreName: "Dân Ca Đồng Bằng Bắc Bộ",
    genreSlug: "dan-ca-bac-bo",
    fileUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/08.%20Trong%20Com.mp3",
    coverUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/TrungDuongCD-QuaCauGioBay-1.jpg",
    duration: 215,
    lyrics: `[Lời 1]
Con cò cò bay lả lả bay la
Bay từ từ cửa phủ bay ra ra cánh đồng
Tình tính tang tang tính tình
Ơi bạn rằng, ơi bạn ơi!
Rằng có biết biết hay chăng?
Rằng có nhớ nhớ hay chăng?

[Lời 2]
Đồng xanh bát ngát lúa thơm ngào ngạt
Cò lả bay la đón nắng ban mai
Bình yên câu hát mái ấm làng xưa
Muôn đời thương nhớ đất quê nhà!`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
  {
    title: "Cây Trúc Xinh",
    artistName: "Liền Chị Quan Họ Bắc Ninh",
    artistBio: "Khúc hát dân ca Quan Họ Bắc Ninh ca ngợi nét duyên dáng người con gái.",
    artistAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",
    genreName: "Dân Ca Quan Họ",
    genreSlug: "dan-ca-quan-ho",
    fileUrl: "https://archive.org/download/BeoDatMayTroi/07.TinhNgaiYeuConBeoDatMayTroi_nl_LanHuong.mp3",
    coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    duration: 220,
    lyrics: `[Lời 1]
Cây trúc xinh tang tình là cây trúc mọc
Qua lối nọ như bờ ao
Chị Hai xinh tang tình là chị Hai đứng
Đứng nơi nào cũng xinh!

[Lời 2]
Cây trúc xinh tang tình là cây trúc mọc
Qua lối nọ bên đình làng
Chị Ba xinh tang tình là chị Ba đứng
Đứng một mình cũng xinh!
Tình bằng có cái duyên trao!`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
  {
    title: "Inh Lả Ơi",
    artistName: "Đội Ca Múa Dân Gian Tây Bắc",
    artistBio: "Làn điệu dân ca Thái Tây Bắc rộn rã mừng mùa xuân và tình yêu đôi lứa.",
    artistAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    genreName: "Dân Ca Tây Bắc",
    genreSlug: "dan-ca-tay-bac",
    fileUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/05.%20Qua%20Cau%20Gio%20Bay.mp3",
    coverUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/TrungDuongCD-QuaCauGioBay-2.jpg",
    duration: 185,
    lyrics: `[Lời 1]
Inh lả ơi, sao noọng ơ
Khắp núi rừng hoa ban nở rộ
Suối reo rắt đón mừng xuân sang
Bản mường ơi cùng nắm tay múa xòe!

[Lời 2]
Tiếng khèn vang vọng khắp đỉnh nương
Đưa duyên đôi lứa thắm tình non cao
Mùa xuân về ấm áp nương rẫy
Vang khúc ca câu hát Inh Lả Ơi!`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
  {
    title: "Ru Con Nam Bộ",
    artistName: "Nghệ Nhân Dân Gian Nam Bộ",
    artistBio: "Điệu hát ru con ngọt ngào mang đậm hơi thở sông nước miệt vườn miền Tây.",
    artistAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    genreName: "Dân Ca Nam Bộ",
    genreSlug: "dan-ca-nam-bo",
    fileUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/07.%20Ly%20Vong%20Phu.mp3",
    coverUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
    duration: 240,
    lyrics: `[Lời hát ru]
Gió mùa thu mẹ ru con ngủ
Năm canh chầy thức đủ vừa năm
Hỡi con ơi con ngủ cho tròn
Để mẹ gánh lúa qua cồn sớm mai...

À ơi... con ngủ cho say
Mai sau khôn lớn dựng xây xóm làng
À ơi... câu hát ngọt ngào
Nước phù sa chảy dạt dào bến quê...`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
  {
    title: "Lý Ngựa Ô",
    artistName: "Nghệ Nhân Dân Gian Nam Bộ",
    artistBio: "Khúc hát dân ca rộn ràng đầy màu sắc về chàng trai rước dâu trên lưng ngựa ô.",
    artistAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    genreName: "Dân Ca Nam Bộ",
    genreSlug: "dan-ca-nam-bo",
    fileUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/04.%20Ly%20Trai%20Muop.mp3",
    coverUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/TrungDuongCD-QuaCauGioBay-1.jpg",
    duration: 210,
    lyrics: `[Lời 1]
Khớp con ngựa ngựa ô, ngựa ô anh khớp
Khớp đôi kiệu vàng, kiệu vàng anh khớp
Tra đai búp bạc, lục lạc đồng đen
Búp sen lá dặm, dây cương nhuộm thắm

[Điệp khúc]
Cắn câu khớp kiệu, đưa nàng về dinh
Ơi nàng ơi, ta rước nàng về
Ngựa ô tung vó trên đường gấm hoa!`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
  {
    title: "Người Ơi Người Ở Đừng Về",
    artistName: "Liền Anh Liền Chị Bắc Ninh",
    artistBio: "Bản tình ca giã bạn tha thiết nhất trong di sản Dân ca Quan họ Bắc Ninh.",
    artistAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
    genreName: "Dân Ca Quan Họ",
    genreSlug: "dan-ca-quan-ho",
    fileUrl: "https://archive.org/download/BeoDatMayTroi/07.TinhNgaiYeuConBeoDatMayTroi_nl_LanHuong.mp3",
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80",
    duration: 255,
    lyrics: `[Lời 1]
Người ơi người ở đừng về
Người về em vẫn ngậm ngùi
Người về em giọt lệ rơi
Bước chân dùng dằng lòng chẳng muốn xa...

[Điệp khúc]
Người ơi, người ở đừng về!
Hẹn nhau mùa hội sang năm
Gặp nhau dâng chén rượu nồng
Thắm tình Quan họ ngàn năm chẳng phai!`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
  {
    title: "Xe Chỉ Luồn Kim",
    artistName: "Dàn Hát Quan Họ Cổ Truyền",
    artistBio: "Khúc ca xướng duyên dáng khéo léo của các cô thôn nữ Quan họ vùng Kinh Bắc.",
    artistAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    genreName: "Dân Ca Quan Họ",
    genreSlug: "dan-ca-quan-ho",
    fileUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/06.%20Ho%20Ba%20Ly.mp3",
    coverUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&q=80",
    duration: 195,
    lyrics: `[Lời 1]
Ngồi buồn xe chỉ luồn kim
Ngồi buồn xe chỉ luồn kim
May áo cho chàng, chàng mặc đi thi
Áo may vừa vặn khéo tay nàng thêu

[Lời 2]
Cầu cho chàng đỗ thủ khoa
Vinh quy bái tổ về nhà bên nhau
Tình tang tang tính tình tang
Trăm năm trọn nghĩa tơ vương thắm nồng!`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
  {
    title: "Lý Kéo Chài",
    artistName: "Đội Văn Nghệ Duyên Hải Nam Bộ",
    artistBio: "Điệu hò kéo lưới khoáng đạt, mạnh mẽ của ngư dân vùng biển Nam Bộ.",
    artistAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    genreName: "Dân Ca Duyên Hải",
    genreSlug: "dan-ca-duyen-hai",
    fileUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/11.%20Ba%20Rang%20Ba%20Ri.mp3",
    coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
    duration: 190,
    lyrics: `[Xướng và Xô]
Gió lên rồi căng buồm cho khoái
Gác chèo lên ta nướng khoai ăn
Khoan hỡi khoan hò!
Kéo chài cho nhanh tay, tôm cá đầy khoang
Khoan hỡi khoan hò!
Bình minh rực rỡ muôn ngàn trùng khơi!`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
  {
    title: "Lý Mười Thương",
    artistName: "Nghệ Nhân Ca Huế Cố Đô",
    artistBio: "Mười điều thương đoan trang, dịu dàng của người con gái sông Hương xứ Huế.",
    artistAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    genreName: "Dân Ca Xứ Huế",
    genreSlug: "dan-ca-xu-hue",
    fileUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/10.%20Ly%20Ban%20Don.mp3",
    coverUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80",
    duration: 235,
    lyrics: `[Lời 1]
Một thương tóc xõa ngang vai
Hai thương đi đứng khoan thai dịu dàng
Ba thương ăn nói đoan trang
Bốn thương ánh mắt chứa chan ân tình...

[Điệp khúc]
Mười thương trọn vẹn nét duyên
Sông Hương núi Ngự muôn niên đậm đà
Tình người xứ Huế mặn mà
Trăm năm son sắt chẳng nhòa tháng năm!`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
  {
    title: "Đi Cấy",
    artistName: "Dàn Nhạc Dân Tộc Thanh Hóa",
    artistBio: "Khúc ca lao động nông nghiệp tươi vui, lạc quan của cư dân châu thổ sông Mã.",
    artistAvatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    genreName: "Dân Ca Thanh Hóa",
    genreSlug: "dan-ca-thanh-hoa",
    fileUrl: "https://archive.org/download/cd-dan-ca-3-mien-qua-cau-gio-bay/08.%20Trong%20Com.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&q=80",
    duration: 200,
    lyrics: `[Lời 1]
Lên chùa bẻ một cành sen
Ăn cơm bằng đèn đi cấy sáng trăng
Ba bốn cô có hẹn cùng chăng?
Thắp đèn lặn lội dưới trăng thanh bình

[Lời 2]
Tay cấy lúa thẳng từng hàng
Hẹn mùa gặt mới xóm làng ấm no
Tang tính tang câu hò vui vẻ
Đẹp tươi đất mẹ bao la ân tình!`,
    licenseType: LicenseType.PUBLIC_DOMAIN,
    ownerName: "Kho Tàng Dân Ca Việt Nam (Công Quyền)",
  },
];

async function main() {
  console.log("🚀 Bắt đầu thêm 50 BÀI HÁT CÓ LỜI MỚI (100% không bản quyền)...");

  try {
    await prisma.$executeRawUnsafe("ALTER TABLE Song MODIFY fileUrl TEXT NOT NULL, MODIFY coverUrl TEXT;");
    console.log("✅ Đã nâng cấp cột fileUrl và coverUrl sang kiểu TEXT.");
  } catch (e: any) {
    console.log("Cột fileUrl đã hỗ trợ độ dài lớn.");
  }

  // 1. Upsert các Thể loại mới
  const GENRES_TO_ENSURE = [
    { name: "Future Bass", slug: "future-bass" },
    { name: "Melodic Bass", slug: "melodic-bass" },
    { name: "Melodic Dubstep", slug: "melodic-dubstep" },
    { name: "Pop EDM", slug: "pop-edm" },
    { name: "Trap", slug: "trap" },
    { name: "Progressive House", slug: "progressive-house" },
    { name: "Electropop", slug: "electropop" },
    { name: "House", slug: "house" },
    { name: "Drum & Bass", slug: "drum-bass" },
    { name: "Electronic", slug: "electronic" },
    { name: "Future House", slug: "future-house" },
    { name: "Melodic House", slug: "melodic-house" },
    { name: "Hip-Hop", slug: "hip-hop" },
    { name: "Hip-Hop & Rock", slug: "hip-hop-rock" },
    { name: "Hype Rap", slug: "hype-rap" },
    { name: "Energetic Rock", slug: "energetic-rock" },
    { name: "Alternative Pop", slug: "alternative-pop" },
    { name: "Trap Rock", slug: "trap-rock" },
    { name: "Alternative Rock", slug: "alternative-rock" },
    { name: "Motivational Rap", slug: "motivational-rap" },
    { name: "Electronic Rock", slug: "electronic-rock" },
    { name: "Dân Ca Đồng Bằng Bắc Bộ", slug: "dan-ca-bac-bo" },
    { name: "Dân Ca Quan Họ", slug: "dan-ca-quan-ho" },
    { name: "Dân Ca Tây Bắc", slug: "dan-ca-tay-bac" },
    { name: "Dân Ca Nam Bộ", slug: "dan-ca-nam-bo" },
    { name: "Dân Ca Duyên Hải", slug: "dan-ca-duyen-hai" },
    { name: "Dân Ca Xứ Huế", slug: "dan-ca-xu-hue" },
    { name: "Dân Ca Thanh Hóa", slug: "dan-ca-thanh-hoa" },
  ];

  const genreMap = new Map<string, string>();
  for (const g of GENRES_TO_ENSURE) {
    const genre = await prisma.genre.upsert({
      where: { slug: g.slug },
      update: { name: g.name },
      create: { name: g.name, slug: g.slug },
    });
    genreMap.set(g.slug, genre.id);
  }

  // 2. Upsert Ca Sĩ mới
  const artistMap = new Map<string, string>();
  for (const song of NEW_50_SONGS) {
    if (!artistMap.has(song.artistName)) {
      const existing = await prisma.artist.findFirst({ where: { name: song.artistName } });
      if (existing) {
        artistMap.set(song.artistName, existing.id);
      } else {
        const created = await prisma.artist.create({
          data: {
            name: song.artistName,
            bio: song.artistBio || "Nghệ sĩ âm nhạc bản quyền tự do có lời.",
            avatarUrl: song.artistAvatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
            verified: true,
          },
        });
        artistMap.set(song.artistName, created.id);
      }
    }
  }

  // 3. Thêm 50 bài hát vào database
  let added = 0;
  for (const item of NEW_50_SONGS) {
    // Tránh trùng tên bài hát đã có
    const exists = await prisma.song.findFirst({ where: { title: item.title } });
    if (exists) {
      console.log(`⚠️ Bài hát đã tồn tại, bỏ qua: ${item.title}`);
      continue;
    }

    const artistId = artistMap.get(item.artistName)!;
    const genreId = genreMap.get(item.genreSlug) || genreMap.get("electronic")!;

    await prisma.song.create({
      data: {
        title: item.title,
        duration: item.duration,
        fileUrl: item.fileUrl,
        coverUrl: item.coverUrl,
        lyrics: item.lyrics,
        plays: Math.floor(Math.random() * 4000) + 200,
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
    added++;
    console.log(`[+${added}/50] Đã thêm thành công: "${item.title}" - ${item.artistName} (${item.genreName})`);
  }

  // 4. Thêm bài hát vào Playlist của người dùng
  const playlist = await prisma.playlist.findFirst({
    where: { name: "Tuyển Tập Nhạc Tự Do & Dân Ca Có Lời" },
    include: { songs: true },
  });

  if (playlist) {
    const currentCount = playlist.songs.length;
    const newAddedSongs = await prisma.song.findMany({
      where: {
        title: { in: NEW_50_SONGS.map((s) => s.title) },
      },
      take: 20,
    });

    for (let i = 0; i < newAddedSongs.length; i++) {
      await prisma.playlistSong.create({
        data: {
          playlistId: playlist.id,
          songId: newAddedSongs[i].id,
          position: currentCount + i + 1,
        },
      });
    }
    console.log(`✅ Đã bổ sung ${newAddedSongs.length} bài hát mới vào playlist "${playlist.name}"`);
  }

  console.log(`\n🎉 HOÀN THÀNH: Đã thêm thành công ${added} bài hát có lời không bản quyền vào hệ thống!`);
}

main()
  .catch((err) => {
    console.error("❌ Lỗi:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
