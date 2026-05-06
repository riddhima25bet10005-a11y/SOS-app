// SOS AI Emergency Engine — Multi-domain expert system

interface ConversationContext {
  history: string[];
  detectedCategory: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  followUpCount: number;
}

const PATTERNS: Record<string, RegExp> = {
  cardiac: /(heart|chest pain|chest tight|cardiac|palpitat|irregular heartbeat|cpr)/i,
  breathing: /(breathe|breathing|asthma|inhaler|choking|suffoca|airway|wheez)/i,
  bleeding: /(bleed|blood|hemorrhag|cut deep|artery|wound|gash|slash)/i,
  fracture: /(fracture|broken bone|broken arm|broken leg|dislocat|sprain|swollen joint)/i,
  burn: /(burn|scald|boiling|hot oil|chemical burn|sunburn severe|blister)/i,
  head: /(head injur|concussion|skull|unconscious|faint|pass out|collapse|seizure|epilep|convuls)/i,
  poison: /(poison|ingest|swallow|overdose|drug|pill|chemical|bleach|acid|toxic|mushroom)/i,
  allergy: /(allerg|anaphyla|epipen|hives|swelling face|throat closing|sting|bee|wasp)/i,
  stroke: /(stroke|face droop|slur speech|arm weak|sudden numb|vision loss)/i,
  diabetes: /(diabet|blood sugar|insulin|hypogly|sugar low|sugar high)/i,
  pregnancy: /(pregnan|contraction|water broke|labor|deliver|baby coming|miscarriage)/i,
  fever: /(fever|temperature|hot forehead|chills|shiver|flu|cold severe)/i,
  vomit: /(vomit|nausea|throw up|food poison|diarrhea|dehydrat)/i,
  headache: /(headache|migraine|head hurt|dizzy|vertigo|light headed)/i,
  pain: /(pain|hurt|ache|sore|cramp|agony)/i,
  snake: /(snake|bite|spider|scorpion|sting|venom)/i,
  drown: /(drown|water|swim|pool|river|sea|submerge)/i,

  fire: /(fire|flame|smoke|burning building|house fire|trapped fire|gas leak|explosion)/i,
  earthquake: /(earthquake|quake|tremor|building shak|collapse|rubble|aftershock)/i,
  flood: /(flood|water rising|submerge|dam|rain heavy|waterlog)/i,
  storm: /(storm|cyclone|tornado|hurricane|lightning|thunder|wind strong)/i,
  landslide: /(landslide|mudslide|hillside|terrain|slope|debris)/i,

  theft: /(stole|steal|rob|theft|snatch|burglar|pickpocket|purse|wallet|mugged|loot|shoplift)/i,
  assault: /(attack|assault|hit me|punch|beat|violen|fight|mob)/i,
  threat: /(threat|gun|knife|weapon|hostage|ransom|blackmail|extor)/i,
  stalking: /(follow|stalk|harass|creep|watch|spy|peep)/i,
  kidnap: /(kidnap|abduct|taken|missing person|disappear|held against)/i,
  accident: /(accident|crash|collision|car hit|truck|bike|road|traffic|vehicle|hit and run)/i,
  domestic: /(domestic|husband|wife|partner|abus|beat me|hit me at home|family violen)/i,

  child: /(child|kid|minor|young|boy|girl|baby|infant|toddler|teen|student|school)/i,
  elderly: /(old|elderly|grandpa|grandma|senior|aged|fall down old)/i,

  anxiety: /(anxious|anxiety|panic attack|panic|hyperventilat|can.t breathe nervous)/i,
  depression: /(depress|hopeless|worthless|no point|give up|empty|numb|nothing matters)/i,
  suicide: /(suicide|kill myself|end it|don.t want to live|die|self harm|cut myself|wrist)/i,
  lonely: /(lonely|alone|nobody|no one|isolated|abandon)/i,
  trauma: /(trauma|ptsd|nightmare|flashback|trigger|abuse survivor)/i,
  stress: /(stress|overwhelm|burnout|can.t cope|breaking down|too much)/i,
  scared: /(scared|afraid|terrif|fright|fear|worried|nervous)/i,

  lost: /(lost|don.t know where|can.t find|stuck|strand|trapped|no way out)/i,
  help: /(help|need|please|urgent|emergency|sos|assist|support)/i,
  greeting: /(hello|hi|hey|good morning|good evening|namaste)/i,
  thanks: /(thank|thanks|appreciate|grateful)/i,
  safe: /(safe|fine|okay|better|good|resolved|sorted|stable)/i,
  unknown: /.*/,
};

const RESPONSES: Record<string, { reply: string; severity: 'low' | 'medium' | 'high' | 'critical'; followUp: string }> = {
  cardiac: {
    severity: 'critical',
    reply: `🚨 CARDIAC EMERGENCY DETECTED

⚡ IMMEDIATE STEPS:
1. Have the person sit upright or in a comfortable position
2. If they have aspirin (300mg), have them CHEW it — do not swallow whole
3. Loosen tight clothing around chest and neck
4. If they become unconscious and stop breathing, start CPR immediately:
   → Place heel of your hand on center of chest
   → Push HARD and FAST — 5cm deep, 100-120 compressions per minute
   → Give 2 rescue breaths after every 30 compressions
5. If an AED (defibrillator) is nearby, use it — it will guide you

⏱️ Call 108 for an ambulance NOW. Every minute without CPR reduces survival by 10%.`,
    followUp: 'Is the person conscious? Are they breathing? Can you feel a pulse on their wrist or neck? I need to know to guide you further.',
  },
  breathing: {
    severity: 'critical',
    reply: `🫁 BREATHING EMERGENCY

If CHOKING:
1. Stand behind the person, wrap your arms around their waist
2. Make a fist above their navel, below the ribcage
3. Give 5 sharp upward thrusts (Heimlich maneuver)
4. Repeat until the object comes out or they lose consciousness
5. If unconscious — lay them flat, begin CPR, check mouth for the object

If ASTHMA ATTACK:
1. Help them sit upright — do NOT lay them down
2. Give 1 puff of their inhaler every 30-60 seconds (max 10 puffs)
3. If no inhaler: have them breathe slowly — in through nose, out through pursed lips
4. Keep them calm — panic makes it worse

If neither works within 5 minutes, call 108 immediately.`,
    followUp: 'Is the person able to cough or make sounds? This tells me if the airway is fully or partially blocked.',
  },
  bleeding: {
    severity: 'critical',
    reply: `🩸 BLEEDING CONTROL PROTOCOL

⚡ IMMEDIATE STEPS:
1. Apply DIRECT, FIRM pressure with a clean cloth or your bare hands
2. Do NOT lift the cloth to check — if it soaks through, add more on top
3. If possible, ELEVATE the wound above the heart
4. For limb wounds: if bleeding won't stop, tie a tourniquet 5cm above the wound
   → Use a belt, scarf, or any strong fabric
   → Tighten until bleeding stops
   → Note the TIME you applied it
5. Keep the person warm — cover them with a blanket

🚫 DO NOT: remove embedded objects, use a tourniquet on the neck/torso, or give water if surgery may be needed.

⏱️ Severe bleeding can cause death in 5 minutes. Call 108 NOW.`,
    followUp: 'Where exactly is the wound? Is the blood spurting (arterial) or flowing steadily? Is the person dizzy or confused?',
  },
  fracture: {
    severity: 'high',
    reply: `🦴 FRACTURE / BONE INJURY

⚡ STEPS:
1. DO NOT move the injured limb — immobilize it in the position you found it
2. If you have something rigid (stick, rolled newspaper, cardboard), use it as a splint
   → Place it along the injured area and tie gently with cloth
3. Apply ice wrapped in cloth (never directly) to reduce swelling — 15 min on, 15 off
4. For suspected SPINE or NECK injury — DO NOT move the person at all
5. If bone is poking through skin (open fracture) — cover with clean cloth, do NOT push it back

💊 Pain management: Ibuprofen 400mg or Paracetamol 500mg if available.
Call 108 for transport — moving incorrectly can cause permanent damage.`,
    followUp: 'Can you move the injured area at all? Is there visible deformity or bone visible? Is the skin around it turning blue?',
  },
  burn: {
    severity: 'high',
    reply: `🔥 BURN TREATMENT

⚡ IMMEDIATE STEPS:
1. Run COOL (not cold/ice) water over the burn for at least 20 minutes
2. Remove clothing and jewelry near the burn UNLESS stuck to skin
3. Cover with clean cling film or a non-fluffy sterile dressing
4. For chemical burns — flush with running water for 20+ minutes, remove contaminated clothes

🚫 DO NOT: use ice, butter, toothpaste, or any home remedy. Do NOT pop blisters.

📏 SEVERITY CHECK:
• Red, painful, no blisters → 1st degree (minor)
• Blisters, swelling, severe pain → 2nd degree (medical attention needed)
• White/charred, no pain (nerves damaged) → 3rd degree (EMERGENCY — call 108)`,
    followUp: 'How large is the burn? Is it bigger than the person\'s palm? Is the skin white or charred? Was it heat, chemical, or electrical?',
  },
  head: {
    severity: 'critical',
    reply: `🧠 HEAD INJURY / UNCONSCIOUSNESS

⚡ IF UNCONSCIOUS:
1. Check if they are breathing — look, listen, feel for 10 seconds
2. If breathing: place in RECOVERY POSITION (on their side)
3. If NOT breathing: start CPR immediately
4. Do NOT move their neck — support their head

⚡ IF CONSCIOUS:
1. Keep them still — do NOT let them walk or get up
2. Apply gentle pressure to any scalp bleeding
3. Monitor for danger signs: vomiting, unequal pupil size, confusion, clear fluid from ears/nose

🚨 DANGER SIGNS requiring immediate 108: Seizures, repeated vomiting, loss of consciousness even briefly, slurred speech, weakness on one side.`,
    followUp: 'Did they hit their head or fall? Are they responsive when you talk to them? Are their pupils the same size?',
  },
  poison: {
    severity: 'critical',
    reply: `☠️ POISONING / OVERDOSE

⚡ CRITICAL RULES:
1. Do NOT induce vomiting unless a medical professional tells you to
2. If the substance is on the skin — remove clothing, flush skin with water for 20 min
3. If inhaled (gas/fumes) — move to fresh air immediately, open all windows
4. If swallowed — identify the substance, read the label, note the time and amount
5. If conscious — give small sips of water (NO milk, NO salt water)
6. If unconscious — recovery position, monitor breathing, be ready for CPR

📞 Call AIIMS Poison Helpline: 1800-116-117 (24/7, free)
📞 Emergency: 108

⚠️ SAVE the container/label — doctors need this information.`,
    followUp: 'What substance was involved? How much was taken? How long ago? Is the person conscious and breathing normally?',
  },
  allergy: {
    severity: 'critical',
    reply: `⚠️ SEVERE ALLERGIC REACTION (ANAPHYLAXIS)

⚡ IMMEDIATE STEPS:
1. If they have an EpiPen — use it NOW on outer thigh (through clothing is OK)
2. Call 108 immediately — anaphylaxis can be fatal within minutes
3. Have them lie down with legs elevated (unless breathing is difficult — then sit upright)
4. Remove the trigger if possible (stinger, food from mouth)
5. If breathing stops — begin CPR
6. A second EpiPen can be given after 5 minutes if no improvement

🚨 SIGNS OF ANAPHYLAXIS: Throat/tongue swelling, difficulty breathing, widespread hives, dizziness, rapid weak pulse, nausea/vomiting.`,
    followUp: 'Do they have an EpiPen? Is their throat swelling? Can they still breathe? What triggered the reaction?',
  },
  stroke: {
    severity: 'critical',
    reply: `🧠 STROKE — ACT F.A.S.T.

Use the F.A.S.T. test:
🔹 F — FACE: Ask them to smile. Does one side droop?
🔹 A — ARMS: Ask them to raise both arms. Does one drift down?
🔹 S — SPEECH: Ask them to repeat a simple sentence. Is it slurred?
🔹 T — TIME: If ANY of these are present — call 108 IMMEDIATELY

⚡ WHILE WAITING:
1. Note the EXACT time symptoms started — this is critical for treatment
2. Do NOT give food, water, or any medication
3. Lay them on their side with head slightly elevated
4. Loosen tight clothing
5. Be ready for CPR if they stop breathing

⏱️ There is a 4.5-hour window for clot-busting medication. Every minute matters.`,
    followUp: 'When did the symptoms start exactly? Can they speak clearly? Can they lift both arms?',
  },
  snake: {
    severity: 'critical',
    reply: `🐍 SNAKE/INSECT BITE

⚡ IMMEDIATE STEPS:
1. Keep the person CALM and STILL — movement spreads venom faster
2. Remove rings, watches, tight clothing near the bite
3. Immobilize the bitten limb — keep it BELOW heart level
4. Mark the edge of swelling with a pen and note the time
5. If possible, take a photo of the snake (from a safe distance)

🚫 DO NOT: Cut the wound, suck out venom, apply ice, use a tourniquet, or give alcohol.

✅ DO: Apply a pressure bandage (firm but not cutting circulation) and get to a hospital with anti-venom facilities.

📞 Call 108 for transport. Anti-venom works best within 2 hours.`,
    followUp: 'What did the snake look like? Where on the body was the bite? Is there swelling or discoloration?',
  },
  fire: {
    severity: 'critical',
    reply: `🔥 FIRE EMERGENCY

⚡ EVACUATION PROTOCOL:
1. GET OUT — do not stop to collect belongings
2. Stay LOW — smoke and heat rise, air is cleaner near the floor
3. Before opening doors: feel the handle — if hot, find another exit
4. Cover your nose and mouth with a WET cloth
5. Use stairs ONLY — never elevators
6. Once outside, move at least 100 meters away from the building
7. If clothes catch fire: STOP, DROP, and ROLL

🚒 Call 101 (Fire Brigade) immediately
📞 For trapped persons, call 112 (National Emergency)

⚠️ If trapped: Close doors between you and the fire, stuff gaps with wet cloth, go to a window and signal for help.`,
    followUp: 'Are you still inside the building? Is anyone trapped? Can you see an exit route? How large is the fire?',
  },
  earthquake: {
    severity: 'critical',
    reply: `🌍 EARTHQUAKE SAFETY

⚡ DURING THE EARTHQUAKE:
1. DROP to your hands and knees
2. Take COVER under a sturdy table or desk
3. HOLD ON until the shaking stops
4. If no shelter: cover your head and neck with your arms, stay away from windows
5. If in bed: stay there, protect your head with a pillow
6. If outdoors: move to an open area away from buildings, trees, power lines

⚡ AFTER THE EARTHQUAKE:
1. Expect aftershocks — they can be strong
2. Check for injuries — apply first aid
3. Check for gas leaks (smell, hissing) — if found, open windows, leave, do NOT use switches
4. Do NOT enter damaged buildings
5. Use stairs, never elevators

📞 Call 1078 (NDMA) for disaster relief coordination.`,
    followUp: 'Are you currently safe? Is anyone injured? Is the building you are in showing cracks or damage?',
  },
  flood: {
    severity: 'high',
    reply: `🌊 FLOOD SAFETY

⚡ IMMEDIATE ACTIONS:
1. Move to HIGHER GROUND immediately — upper floors, rooftop, elevated terrain
2. Do NOT walk through moving water — 15cm can knock you down, 60cm can sweep a car
3. Do NOT drive through flooded roads
4. Turn off electricity at the main switch if water is entering your home
5. Store drinking water in clean containers — flood water is contaminated
6. Keep your phone charged — conserve battery for emergency calls

⚠️ If trapped by rising water: Go to the highest point, signal for help, call 1078 (NDMA) or 112.

After flood: Avoid flood water (sewage, chemicals), boil all drinking water, check for structural damage before re-entering buildings.`,
    followUp: 'How high is the water? Are you on higher ground? Do you have access to clean water and food?',
  },
  theft: {
    severity: 'medium',
    reply: `🚨 THEFT / ROBBERY REPORT

⚡ IMMEDIATE STEPS:
1. Move to a SAFE location — a shop, ATM area, or public space with CCTV
2. Do NOT chase the thief — your safety is more important than belongings
3. Note everything you can remember: appearance, clothing, direction they went, vehicle details
4. Check for nearby CCTV cameras that may have footage

📞 REPORTING:
• Call 100 (Police) to file an FIR
• For online fraud: Call 1930 (Cyber Crime Helpline)
• File an online FIR at your state police website

📱 If phone was stolen: Call your carrier to block the SIM, use Find My Device to track/wipe, change passwords for banking and email.`,
    followUp: 'Are you safe now? Can you describe what the person looked like? Was any violence involved? Was your phone or ID stolen?',
  },
  assault: {
    severity: 'critical',
    reply: `🚨 ASSAULT / VIOLENCE

⚡ YOUR SAFETY FIRST:
1. Get to a SAFE location away from the attacker
2. If injured, apply pressure to any wounds
3. Call 100 (Police) immediately
4. Do NOT wash or change clothes — preserve evidence
5. If possible, note the attacker's description and any witnesses

📞 HELPLINES:
• Police: 100
• Women Helpline: 1091 / 181
• Ambulance: 108

⚖️ Your right: Police MUST register your FIR. If they refuse, contact the SP/Commissioner directly or file online.`,
    followUp: 'Are you safe right now? Are you physically injured? Do you know the attacker? Do you need medical attention?',
  },
  domestic: {
    severity: 'critical',
    reply: `🛡️ DOMESTIC VIOLENCE — YOU ARE NOT ALONE

⚡ IMMEDIATE SAFETY:
1. If in immediate danger: call 100 (Police) or 112 (Emergency)
2. Move to a safe room, lock the door
3. If you can leave safely, go to a neighbor, relative, or women's shelter
4. Pack a small emergency bag if possible: ID, phone charger, money, medications

📞 HELPLINES (24/7, confidential):
• Women Helpline: 181
• National Commission for Women: 7827-170-170
• One Stop Centre: 1091

⚖️ Under the Protection of Women from Domestic Violence Act, you have the RIGHT to stay in your home and get a protection order.`,
    followUp: 'Are you safe right now? Is the person still in the house? Do you have children with you? Do you need immediate police or medical help?',
  },
  anxiety: {
    severity: 'medium',
    reply: `🧘 PANIC / ANXIETY ATTACK — I AM RIGHT HERE WITH YOU

You are safe. What you are feeling is your body's alarm system — it is intense but it WILL pass. Nothing bad is happening to you.

⚡ GROUNDING TECHNIQUE (do this with me):
1. 👀 Name 5 things you can SEE
2. ✋ Name 4 things you can TOUCH
3. 👂 Name 3 things you can HEAR
4. 👃 Name 2 things you can SMELL
5. 👅 Name 1 thing you can TASTE

🫁 BREATHING (follow my count):
• Breathe IN slowly: 1... 2... 3... 4...
• HOLD gently: 1... 2... 3... 4...
• Breathe OUT slowly: 1... 2... 3... 4... 5... 6...
• Repeat 5 times

This WILL pass. You have survived every panic attack before, and you will survive this one too.`,
    followUp: 'How are you feeling now? Is the intensity reducing? Would you like to do the breathing exercise together again?',
  },
  suicide: {
    severity: 'critical',
    reply: `💙 I HEAR YOU — YOUR LIFE MATTERS

I am here, and I am not going anywhere. What you are feeling right now is real pain, and I take it seriously.

⚡ PLEASE DO THIS RIGHT NOW:
1. If you have access to anything that could hurt you — move away from it
2. Call someone you trust — a friend, family member, anyone
3. If you cannot call anyone, stay right here with me

📞 24/7 CRISIS HELPLINES (free, confidential):
• iCall: 9152987821
• Vandrevala Foundation: 1860-2662-345
• AASRA: 9820466726
• Snehi: 044-24640050

You are not a burden. You are not weak. You are someone in pain who deserves help. Reaching out took incredible courage.

I am staying right here. Talk to me.`,
    followUp: 'Are you safe right now? Is there someone near you? I want to make sure you are not alone. Will you tell me what is happening?',
  },
  depression: {
    severity: 'high',
    reply: `💙 I HEAR YOU

What you are feeling is valid. Depression lies to you — it tells you things won't get better, that you are worthless. Those are symptoms of an illness, not truths about you.

⚡ RIGHT NOW, TRY THIS:
1. Place your feet flat on the ground. Feel the surface beneath you.
2. Take one slow breath. You do not need to fix everything right now.
3. Can you drink some water? Sometimes our body needs the basics first.

📞 PROFESSIONAL SUPPORT:
• Vandrevala Foundation (24/7): 1860-2662-345
• iCall: 9152987821

💡 REMEMBER: Depression is a medical condition. It is treatable. Millions of people have walked through this and come out the other side. You can too.`,
    followUp: 'When did you start feeling this way? Have you spoken to a counselor before? I am here — take your time.',
  },
  child: {
    severity: 'high',
    reply: `🧒 I AM HERE — YOU ARE SO BRAVE FOR REACHING OUT

Hi there. My name is the SOS AI Agent, and I am here to help you. You did the right thing.

⚡ IMPORTANT QUESTIONS:
1. Are you safe right now? Is anyone hurting you?
2. Is there a grown-up you trust nearby — a teacher, neighbor, or relative?
3. Where are you right now?

📞 CHILD HELPLINE: 1098 (free, 24/7)
This number is just for kids. They will listen and help.

Remember: Whatever is happening, it is NOT your fault. You deserve to be safe and happy. I am not going anywhere until you tell me you are okay.`,
    followUp: 'Can you tell me what is happening? Are you at home, school, or somewhere else? Is there a grown-up you trust nearby?',
  },
  elderly: {
    severity: 'high',
    reply: `🧓 ELDERLY PERSON ASSISTANCE

⚡ IF THEY HAVE FALLEN:
1. Do NOT rush to pull them up — check for injuries first
2. Ask if they can feel pain anywhere (hip, wrist, head)
3. If no severe pain: help them roll to their side, then slowly get up using a chair for support
4. If in pain or confused: do NOT move them, call 108

⚡ GENERAL STEPS:
1. Check if they are on any medications that need to be taken
2. Ensure they are warm and hydrated
3. If they seem confused or disoriented, note the time — this could indicate a stroke

📞 Elder Helpline: 14567 (free, government)
📞 Ambulance: 108`,
    followUp: 'What happened? Did they fall? Are they conscious and talking? Do they have any known medical conditions?',
  },
  accident: {
    severity: 'critical',
    reply: `🚗 ROAD ACCIDENT EMERGENCY

⚡ IMMEDIATE STEPS:
1. Check if you and others are safe — move away from traffic if possible
2. Call 108 (Ambulance) and 100 (Police)
3. Turn on hazard lights, place warning triangles if available
4. DO NOT move injured persons unless there is danger of fire/explosion
5. If someone is bleeding heavily — apply direct pressure
6. If unconscious but breathing — place in recovery position on their side

📸 DOCUMENTATION:
• Take photos of the scene, vehicles, injuries, license plates
• Note names and numbers of witnesses
• Do NOT admit fault at the scene

⚖️ Under Motor Vehicles Act, bystanders providing first aid are protected from legal liability.`,
    followUp: 'How many people are injured? Is anyone trapped in a vehicle? Is there a risk of fire or fuel leak?',
  },
  lost: {
    severity: 'medium',
    reply: `📍 YOU ARE LOST / STRANDED

⚡ IMMEDIATE STEPS:
1. STOP moving — staying put makes you easier to find
2. Share your Live Location using the button below
3. Look for landmarks: road signs, shop names, building numbers
4. If you have mobile signal, share your Google Maps location with someone you trust

📱 QUICK LOCATION SHARE:
• Open Google Maps → tap blue dot → tap "Share Location"
• Or send your GPS coordinates using the location buttons below

📞 If in danger: Call 112 (National Emergency Number — works without SIM/balance)

Stay calm. We will figure this out together.`,
    followUp: 'Can you see any road signs, shop names, or landmarks near you? Do you have access to Google Maps on your phone?',
  },
  greeting: {
    severity: 'low',
    reply: `Hello! I am the SOS AI Emergency Agent, available 24/7 to help you.

I can assist you with:
🏥 Medical emergencies (injuries, CPR, first aid, poisoning)
🚔 Safety & security (theft, assault, stalking, domestic violence)
🔥 Fire & disasters (evacuation, earthquake, flood safety)
🧠 Mental health (panic attacks, crisis support, depression)
🧒 Child & elderly safety
🚗 Road accidents

Tell me what is happening, and I will guide you step by step. If it is an emergency, I will also give you the exact helpline number to call.`,
    followUp: 'What can I help you with today?',
  },
  thanks: {
    severity: 'low',
    reply: `You are welcome. I am glad I could help. Remember, I am available 24/7 — do not hesitate to reach out anytime you need guidance. Stay safe! 🙏`,
    followUp: 'Is there anything else I can help you with?',
  },
  safe: {
    severity: 'low',
    reply: `That is great to hear. I am relieved you are okay.

📝 AFTER AN EMERGENCY — REMEMBER:
1. Monitor yourself for delayed symptoms over the next 24-48 hours
2. Stay hydrated and get rest
3. Talk to someone you trust about what happened
4. If you feel anxious or have flashbacks, that is normal — consider speaking to a counselor

I am here 24/7 if you need me again. Take care of yourself. 💙`,
    followUp: 'Is there anything else you need help with?',
  },
  unknown: {
    severity: 'low',
    reply: `I am an AI emergency assistant, but I am having trouble understanding your situation. 

Please use clear keywords (like "bleeding", "fire", "heart attack", "accident") so I can give you the right instructions.

If this is a life-threatening emergency, please CALL 112 immediately.`,
    followUp: 'Can you describe the emergency again using simple keywords?',
  }
};

export function getAIResponse(input: string, context: ConversationContext): { reply: string; category: string; severity: string } {
  const msgLower = input.toLowerCase();

  // Check all patterns
  for (const [key, pattern] of Object.entries(PATTERNS)) {
    if (pattern.test(msgLower)) {
      const resp = RESPONSES[key];
      if (resp) {
        // If same category detected again, give follow-up
        if (context.detectedCategory === key && context.followUpCount > 0) {
          return { reply: resp.followUp, category: key, severity: resp.severity };
        }
        return { reply: resp.reply, category: key, severity: resp.severity };
      }
    }
  }

  // Context-aware follow-up if we have a previous emergency category
  if (context.detectedCategory && RESPONSES[context.detectedCategory] && context.detectedCategory !== 'greeting' && context.detectedCategory !== 'unknown') {
    return {
      reply: RESPONSES[context.detectedCategory].followUp,
      category: context.detectedCategory,
      severity: RESPONSES[context.detectedCategory].severity,
    };
  }

  // Default fallback if we don't understand and there's no context
  return {
    reply: RESPONSES.unknown.reply,
    category: 'unknown',
    severity: 'low',
  };
}
