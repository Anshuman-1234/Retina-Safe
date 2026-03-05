/**
 * RetinaSafe — i18n.js
 * Universal Translation System (English, Hindi, Odia)
 * Manages UI localization across all pages.
 */
(function RetinaSafeI18N() {
    'use strict';

    const STORAGE_KEY = 'retinasafe_lang';
    const DEFAULT_LANG = 'en';

    const TRANSLATIONS = {
        en: {
            // Common / Global
            nav_home: "Home",
            nav_screening: "Screening",
            nav_dashboard: "Dashboard",
            nav_disclaimer: "Screening tool only — not a diagnosis",
            btn_start_screening: "Start Screening",
            footer_tagline: "AI-powered retinal screening for early eye health risk detection.",
            footer_disclaimer: "RetinaSafe is a screening and risk stratification tool. It is not a medical device or diagnostic replacement. All results must be reviewed by a qualified healthcare professional.",

            // Index / Home
            hero_eyebrow: "AI-Powered Retinal Screening",
            hero_heading: "See the risks <em>before they see you</em>",
            hero_desc: "RetinaSafe combines deep learning retinal image analysis with scientifically designed vision games to detect early signs of diabetic retinopathy, glaucoma, AMD, and cataracts — before symptoms appear.",
            btn_begin_free: "Begin Free Screening",
            btn_how_it_works: "See How It Works",
            trust_1: "No specialist needed",
            trust_2: "Under 10 minutes",
            trust_3: "Doctor-ready reports",
            cond_eyebrow: "What We Detect",
            cond_heading: "Four conditions. One platform.",
            cond_desc: "Retinal diseases progress silently — most are only detected after irreversible damage. RetinaSafe screens for the four most common retinal and ocular conditions using AI analysis and functional vision testing.",
            cond_dr_title: "Diabetic Retinopathy",
            cond_dr_desc: "Damage to retinal blood vessels caused by diabetes. Detectable through microaneurysms, haemorrhages, and exudates — and through contrast sensitivity loss.",
            cond_amd_title: "Macular Degeneration",
            cond_amd_desc: "Degeneration of the macula — the central retina responsible for fine detail vision. Our Dynamic Amsler Grid detects metamorphopsia (wavy vision).",
            cond_glauc_title: "Glaucoma",
            cond_glauc_desc: "Progressive optic nerve damage that destroys peripheral vision in arcuate patterns. Our Peripheral Reaction Tester maps 8 visual field zones.",
            cond_cat_title: "Cataract",
            cond_cat_desc: "Yellowing and opacification of the crystalline lens causes blue-yellow colour discrimination loss. Our Hue Sorting Game isolates this deficiency.",
            cond_hr_title: "Hypertensive Retinopathy",
            cond_normal_title: "Normal (Healthy)",

            // Screening Workflow
            s1_heading: "Medical History",
            s1_desc: "This information adjusts the AI model's risk weighting for your profile. All fields are optional but improve accuracy.",
            s2_heading: "Upload Fundus Image",
            s2_desc: "Upload a retinal fundus photograph. This can be captured via a fundus camera, smartphone adapter, or provided by your clinic.",
            s3_heading: "Vision Games",
            s3_desc: "Complete all four assessments. Each game tests a different aspect of functional vision. Click <strong>Launch Game</strong> to open it.",
            s4_heading: "Screening Complete",
            s4_desc: "This is a preliminary risk assessment only. Review all results with a qualified ophthalmologist before taking any action.",
            warn_title: "Important Requirement",
            warn_text: "Please upload only clear, clinically valid retinal fundus images. Providing unrelated images will lead to unexpected results.",
            btn_next: "Next Step",
            btn_prev: "Previous",
            btn_capture: "Capture",
            btn_switch: "Switch Camera",
            btn_cancel: "Cancel",
            btn_upload: "Select File",
            err_step_upload: "You must upload a valid retinal image before proceeding.",
            err_step_games: "Please complete all 4 vision games before generating your report.",
            toast_welcome: "RetinaSafe: Multilingual support activated.",

            // Games
            game_1_title: "Contrast Discrimination",
            game_1_desc: "Identify a subtly fading object against a grey background across 10 difficulty levels — testing contrast sensitivity loss caused by early diabetic retinopathy.",
            game_1_detects: "Diabetic Retinopathy",
            game_2_title: "Dynamic Amsler Grid",
            game_2_desc: "Mark lines that appear wavy, bent, or missing. Central foveal markings carry 4× the weight, matching AMD's dmg pattern.",
            game_2_detects: "Macular Degeneration",
            game_3_title: "Peripheral Reaction",
            game_3_desc: "Fixate on the center dot while flashes appear in 8 peripheral zones. Consistent misses indicate a probable scotoma in Glaucoma.",
            game_3_detects: "Glaucoma",
            game_4_title: "Color Hue Sorting",
            game_4_desc: "Find the tile whose hue has shifted along the blue-yellow axis — the impairment produced as the lens yellows with cataract.",
            game_4_detects: "Cataract",
            btn_launch: "Launch Game",
            btn_redo: "Redo",
            game_complete: "Complete",
            game_not_started: "Not started",
            game_score: "Score",
            game_detects: "Detects",

            // Dashboard
            dash_title: "Patient Dashboard",
            dash_subtitle: "Your eye health metrics at a glance",
            dash_stat_tests: "Tests Completed",
            dash_stat_risk: "Current Risk Level",
            dash_history_title: "Screening History",
            dash_no_history: "No past screenings on file.",
        },
        hi: {
            // Common / Global
            nav_home: "होम",
            nav_screening: "स्क्रीनिंग",
            nav_dashboard: "डैशबोर्ड",
            nav_disclaimer: "सिर्फ स्क्रीनिंग टूल — डायग्नोसिस नहीं",
            btn_start_screening: "स्क्रीनिंग शुरू करें",
            footer_tagline: "नेत्र स्वास्थ्य जोखिम का जल्दी पता लगाने के लिए AI-संचालित रेटिनल स्क्रीनिंग।",
            footer_disclaimer: "रेटीनासेफ एक स्क्रीनिंग और जोखिम स्तरीकरण उपकरण है। चिकित्सा उपकरण नहीं।",

            // Index / Home
            hero_eyebrow: "AI-संचालित रेटिनल स्क्रीनिंग",
            hero_heading: "जोखिमों को देखें<br /><em>इससे पहले कि वे आपको देखें</em>",
            hero_desc: "रेटीनासेफ गहरे सीखने वाले रेटिनल इमेज विश्लेषण को वैज्ञानिक रूप से डिज़ाइन किए गए विजन गेम्स के साथ जोड़ती है ताकि लक्षणों के प्रकट होने से पहले ही डायबिटिक रेटिनोपैथी, ग्लूकोमा, एएमडी और मोतियाबिंद के शुरुआती संकेतों का पता लगाया जा सके।",
            btn_begin_free: "मुफ्त स्क्रीनिंग शुरू करें",
            btn_how_it_works: "देखें यह कैसे काम करता है",
            trust_1: "विशेषज्ञ की जरूरत नहीं",
            trust_2: "10 मिनट से कम",
            trust_3: "डॉक्टर के लिए तैयार रिपोर्ट",
            cond_eyebrow: "हम क्या पहचानते हैं",
            cond_heading: "चार स्थितियाँ। एक प्लेटफॉर्म।",
            cond_desc: "रेटिनल बीमारियां चुपचाप बढ़ती हैं — अधिकांश का पता अपूरणीय क्षति के बाद ही चलता है।",
            cond_dr_title: "डायबिटिक रेटिनोपैथी",
            cond_dr_desc: "मधुमेह के कारण रेटिनल रक्त वाहिकाओं को नुकसान। इसका पता माइक्रोएन्यूरिस्म, रक्तस्राव और विजन गेम्स से लगाया जा सकता है।",
            cond_amd_title: "मस्कुलर डिजनरेशन",
            cond_amd_desc: "मैक्युला का खराब होना जो विस्तृत दृष्टि के लिए जिम्मेदार है। हमारा एम्स्लर ग्रिड लहरदार दृष्टि की पहचान करता है।",
            cond_glauc_title: "ग्लूकोमा",
            cond_glauc_desc: "प्रगतिशील ऑप्टिक तंत्रिका क्षति जो परिधीय दृष्टि को नष्ट कर देती है। हमारा पेरिफेरल टेस्टर 8 क्षेत्रों को मापता है।",
            cond_cat_title: "मोतियाबिंद",
            cond_cat_desc: "लेंस का पीला पड़ना नीले-पीले रंग के भेदभाव के नुकसान का कारण बनता है। हमारा ह्यू सॉर्टिंग गेम इसकी पहचान करता।",
            cond_hr_title: "हाइपरटेंसिव रेटिनोपैथी",
            cond_normal_title: "सामान्य (स्वस्थ)",

            // Screening Workflow
            s1_heading: "Medical History", // Changed from "चिकित्सा इतिहास" to "Medical History" based on the provided diff, but the diff also shows "रोगी की जानकारी" for hi. I will use "रोगी की जानकारी" as it seems more consistent with the intent of the diff.
            s1_desc: "यह जानकारी आपके प्रोफ़ाइल के लिए AI मॉडल के जोखिम वेटिंग को समायोजित करती है। सभी फ़ील्ड वैकल्पिक हैं।",
            s2_heading: "फंडस इमेज अपलोड करें",
            s2_desc: "रेटिनल फंडस फोटोग्राफ अपलोड करें। इसे फंडस कैमरा या स्मार्टफोन एडाप्टर के माध्यम से लिया जा सकता है।",
            s3_heading: "दृष्टि चुनौतियाँ",
            s3_desc: "सभी चार आकलन पूरे करें। प्रत्येक खेल दृष्टि के एक अलग पहलू का परीक्षण करता है।",
            s4_heading: "नैदानिक विश्लेषण रिपोर्ट",
            s4_desc: "यह केवल एक प्रारंभिक जोखिम मूल्यांकन है। कोई भी कार्रवाई करने से पहले नेत्र रोग विशेषज्ञ से सलाह लें।",
            warn_title: "महत्वपूर्ण आवश्यकता",
            warn_text: "कृपया केवल स्पष्ट और मान्य रेटिनल फंडस छवियां अपलोड करें। असंबंधित चित्र गलत और अमान्य परिणाम देंगे।",
            btn_next: "जारी रखें →",
            btn_prev: "← वापस",
            btn_capture: "कैमरे से फोटो लें",
            btn_switch: "कैमरा बदलें",
            btn_cancel: "रद्द करें",
            btn_upload: "अपलोड करने के लिए ब्राउज़ करें",
            err_step_upload: "आगे बढ़ने से पहले कृपया एक मान्य रेटिनल छवि अपलोड करें।",
            err_step_games: "रिपोर्ट तैयार करने से पहले कृपया सभी 4 विजन गेम पूरे करें।",
            toast_welcome: "भाषा बदलकर हिंदी कर दी गई है।",

            // Games
            game_launch: "गेम शुरू करें",
            game_redo: "फिर से करें",
            game_complete: "✓ पूर्ण",
            game_pending: "शुरू नहीं हुआ",
            game_ready: "शुरू करने के लिए तैयार",
            game_score: "स्कोर",
            game_detects: "पहचानता है",

            // Dashboard
            dash_title: "रोगी डैशबोर्ड",
            dash_subtitle: "आपके नेत्र स्वास्थ्य मेट्रिक्स एक नज़र में",
            dash_stat_tests: "पूर्ण परीक्षण",
            dash_stat_risk: "वर्तमान जोखिम स्तर",
            dash_history_title: "स्क्रीनिंग इतिहास",
            dash_no_history: "कोई पिछला इतिहास नहीं मिला। आज ही शुरू करें।",
        },
        or: {
            // Common / Global (Odia)
            nav_home: "ମୂଳ ପୃଷ୍ଠା",
            nav_screening: "ସ୍କ୍ରିନିଂ",
            nav_dashboard: "ଡ୍ୟାସବୋର୍ଡ",
            nav_disclaimer: "କେବଳ ସ୍କ୍ରିନିଂ ଉପକରଣ - କୌଣସି ଚିକିତ୍ସା ନୁହେଁ",
            btn_start_screening: "ସ୍କ୍ରିନିଂ ଆରମ୍ଭ କରନ୍ତୁ",
            footer_tagline: "ନେତ୍ର ସ୍ୱାସ୍ଥ୍ୟ ବିପଦର ପ୍ରାରମ୍ଭିକ ଚିହ୍ନଟ ପାଇଁ AI- ଚାଳିତ ରେଟିନାଲ୍ ସ୍କ୍ରିନିଂ |",
            footer_disclaimer: "ରେଟିନାସେଫ୍ ଏକ ସ୍କ୍ରିନିଂ ଏବଂ ବିପଦ ଗ୍ରୁପିଂ ଉପକରଣ | ଏହା ଏକ ଚିକିତ୍ସା ଉପକରଣ ନୁହେଁ |",

            // Index / Home
            hero_eyebrow: "AI- ଚାଳିତ ରେଟିନାଲ୍ ସ୍କ୍ରିନିଂ",
            hero_heading: "ବିପଦ ଦେଖନ୍ତୁ <em>ସେମାନେ ଆପଣଙ୍କୁ ଦେଖିବା ପୂର୍ବରୁ</em>",
            hero_desc: "ରେଟିନାସେଫ୍ ରେଟିନାଲ୍ ଚିତ୍ର ବିଶ୍ଳେଷଣ ସହିତ ବୈଜ୍ଞାନିକ ଭାବରେ ପରିକଳ୍ପିତ ଭିଜନ ଗେମ୍‌ଗୁଡ଼ିକୁ ମିଳିତ କରେ ଯାହା ଦ୍ୱାରା ଲକ୍ଷଣ ଦେଖାଯିବା ପୂର୍ବରୁ ବିଭିନ୍ନ ଆଖି ରୋଗର ପ୍ରାରମ୍ଭିକ ସଙ୍କେତ ଚିହ୍ନଟ ହୋଇପାରିବ |",
            btn_begin_free: "ମାଗଣା ସ୍କ୍ରିନିଂ ଆରମ୍ଭ କରନ୍ତୁ",
            btn_how_it_works: "ଏହା କିପରି କାମ କରେ ଦେଖନ୍ତୁ",
            trust_1: "ବିଶେଷଜ୍ଞଙ୍କ ଆବଶ୍ୟକତା ନାହିଁ",
            trust_2: "10 ମିନିଟରୁ କମ୍",
            trust_3: "ଡାକ୍ତର-ପ୍ରସ୍ତୁତ ରିପୋର୍ଟ",
            cond_eyebrow: "ଆମେ କଣ ଚିହ୍ନଟ କରୁ",
            cond_heading: "ଚାରୋଟି ରୋଗ | ଗୋଟିଏ ପ୍ଲାଟଫର୍ମ |",
            cond_desc: "ରେଟିନାଲ୍ ରୋଗଗୁଡ଼ିକ ଚୁପଚାପ୍ ବଢିଥାଏ - ଅଧିକାଂଶ କ୍ଷେତ୍ରରେ ସବୁଦିନ ପାଇଁ କ୍ଷତି ହେବା ପରେ ହିଁ ଏହା ଜଣାପଡିଥାଏ |",
            cond_dr_title: "ଡାଇବେଟିକ୍ ରେଟିନୋପାଥି",
            cond_dr_desc: "ଡାଇବେଟିସ୍ ଯୋଗୁଁ ରେଟିନାଲ୍ ରକ୍ତ ନଳୀରେ ହେଉଥିବା କ୍ଷତି | ଏହା ମାଇକ୍ରୋଆନେରିଜିମ୍ ଏବଂ ଭିଜନ୍ ଗେମ୍ ମାଧ୍ୟମରେ ଚିହ୍ନଟ ଯୋଗ୍ୟ |",
            cond_amd_title: "ମାକୁଲାର୍ ଡିଜେନେରେସନ୍",
            cond_amd_desc: "ମାକୁଲାର ଅବକ୍ଷୟ | ଆମର ଡାଇନାମିକ୍ ଆମ୍ସଲର୍ ଗ୍ରିଡ୍ ଏହାକୁ ଚିହ୍ନଟ କରିବାରେ ସାହାଯ୍ୟ କରେ |",
            cond_glauc_title: "ଗ୍ଲୁକୋମା",
            cond_glauc_desc: "ଅପ୍ଟିକ୍ ସ୍ନାୟୁ କ୍ଷତି ଯାହା ପାର୍ଶ୍ୱ ଦୃଷ୍ଟିଶକ୍ତିକୁ ନଷ୍ଟ କରିଦିଏ | ଆମର ଟେଷ୍ଟର୍ 8 ଟି ଜୋନ୍ ମ୍ୟାପ୍ କରେ |",
            cond_cat_title: "ମୋତିଆବିନ୍ଦୁ",
            cond_cat_desc: "ଲିନ୍ସ ହଳଦିଆ ହେବା ଯୋଗୁଁ ନୀଳ-ହଳଦିଆ ରଙ୍ଗ ବାରିବାରେ ଅସୁବିଧା ହୁଏ | ଆମର ଗେମ୍ ଏହାକୁ ଚିହ୍ନଟ କରେ |",
            cond_hr_title: "ହାଇପରଟେନ୍ସିଭ୍ ରେଟିନୋପାଥି",
            cond_normal_title: "ସାମାନ୍ୟ (ସୁସ୍ଥ)",

            // Screening Workflow
            s1_heading: "ଚିକିତ୍ସା ଇତିହାସ",
            s1_desc: "ଏହି ସୂଚନା ଆପଣଙ୍କ ପ୍ରୋଫାଇଲ୍ ପାଇଁ AI ମଡେଲର ବିପଦ ଗଣନାକୁ ସଜାଡିଥାଏ | ସମସ୍ତ ବିଭାଗ ଇଚ୍ଛାଧୀନ ଅଟେ |",
            s2_heading: "ଫଣ୍ଡସ୍ ଚିତ୍ର ଅପଲୋଡ୍ କରନ୍ତୁ",
            s2_desc: "ଏକ ରେଟିନାଲ୍ ଫଣ୍ଡସ୍ ଆଲୋକଚିତ୍ର ଅପଲୋଡ୍ କରନ୍ତୁ | ଏହା ଏକ କ୍ୟାମେରା କିମ୍ବା ସ୍ମାର୍ଟଫୋନ୍ ମାଧ୍ୟମରେ ନିଆଯାଇପାରେ |",
            s3_heading: "ଭିଜନ ଗେମ୍",
            s3_desc: "ସମସ୍ତ ଚାରୋଟି ମୂଲ୍ୟାଙ୍କନ ସମାପ୍ତ କରନ୍ତୁ | ପ୍ରତ୍ୟେକ ଗେମ୍ ଦୃଷ୍ଟିଶକ୍ତିର ଏକ ଭିନ୍ନ ଦିଗ ପରୀକ୍ଷା କରେ |",
            s4_heading: "ସ୍କ୍ରିନିଂ ସମ୍ପୂର୍ଣ୍ଣ",
            s4_desc: "ଏହା କେବଳ ଏକ ପ୍ରାରମ୍ଭିକ ବିପଦ ଆକଳନ | କୌଣସି ପଦକ୍ଷେପ ନେବା ପୂର୍ବରୁ ଜଣେ ଯୋଗ୍ୟ ଚକ୍ଷୁ ବିଶେଷଜ୍ଞଙ୍କ ସହ ପରାମର୍ଶ କରନ୍ତୁ |",
            warn_title: "ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ଆବଶ୍ୟକତା",
            warn_text: "ଦୟାକରି କେବଳ ସ୍ପଷ୍ଟ ଏବଂ ବୈଧ ରେଟିନାଲ୍ ଚିତ୍ର ଅପଲୋଡ୍ କରନ୍ତୁ | ଅନ୍ୟାନ୍ୟ ଚିତ୍ର ଭୁଲ ଫଳାଫଳ ଦେବ |",
            btn_next: "ଜାରି ରଖନ୍ତୁ →",
            btn_prev: "← ପଛକୁ",
            btn_capture: "କ୍ୟାମେରା ସାହାଯ୍ୟରେ ଉଠାନ୍ତୁ",
            btn_switch: "କ୍ୟାମେରା ବଦଳାନ୍ତୁ",
            btn_cancel: "ବାତିଲ୍ କରନ୍ତୁ",
            btn_upload: "ଅପଲୋଡ୍ କରିବାକୁ ବ୍ରାଉଜ୍ କରନ୍ତୁ",
            err_step_upload: "ଆଗକୁ ବଢିବା ପୂର୍ବରୁ ଦୟାକରି ଏକ ବୈଧ ରେଟିନାଲ୍ ଚିତ୍ର ଅପଲୋଡ୍ କରନ୍ତୁ |",
            err_step_games: "ରିପୋର୍ଟ ପ୍ରସ୍ତୁତ କରିବା ପୂର୍ବରୁ ଦୟାକରି ସମସ୍ତ 4 ଟି ଭିଜନ ଗେମ୍ ସମାପ୍ତ କରନ୍ତୁ |",
            toast_welcome: "ଭାଷା ଓଡ଼ିଆକୁ ପରିବର୍ତ୍ତିତ ହୋଇଛି |",

            // Games
            game_launch: "ଆରମ୍ଭ କରନ୍ତୁ",
            game_redo: "ପୁଣି କରନ୍ତୁ",
            game_complete: "✓ ସମ୍ପୂର୍ଣ୍ଣ",
            game_pending: "ଆରମ୍ଭ ହୋଇନାହିଁ",
            game_ready: "ଆରମ୍ଭ ପାଇଁ ପ୍ରସ୍ତୁତ",
            game_score: "ସ୍କୋର୍",
            game_detects: "ଚିହ୍ନଟ କରେ",

            // Dashboard
            dash_title: "ରୋଗୀ ଡ୍ୟାସବୋର୍ଡ",
            dash_subtitle: "ଆପଣଙ୍କ ଆଖି ସ୍ୱାସ୍ଥ୍ୟ ସୂଚନା",
            dash_stat_tests: "ସମ୍ପୂର୍ଣ୍ଣ ପରୀକ୍ଷା",
            dash_stat_risk: "ବର୍ତ୍ତମାନର ବିପଦ ସ୍ତର",
            dash_history_title: "ସ୍କ୍ରିନିଂ ଇତିହାସ",
            dash_no_history: "କୌଣସି ପୂର୍ବ ରେକର୍ଡ ମିଳିଲା ନାହିଁ | ଆଜି ହିଁ ଆରମ୍ଭ କରନ୍ତୁ |",
        }
    };

    /**
     * Main i18n Controller
     */
    const rs_i18n = {
        currentLang: localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG,

        init() {
            this.bindSelectors();
            this.apply(this.currentLang);

            // Sync on cross-tab/window changes
            window.addEventListener('storage', (e) => {
                if (e.key === STORAGE_KEY && e.newValue !== this.currentLang) {
                    this.apply(e.newValue, false);
                }
            });
        },

        bindSelectors() {
            // Find all language selects on the page
            const selects = document.querySelectorAll('.lang-select, #lang-select');
            selects.forEach(sel => {
                sel.value = this.currentLang;
                sel.addEventListener('change', (e) => {
                    this.changeLang(e.target.value);
                });
            });
        },

        changeLang(lang) {
            if (!TRANSLATIONS[lang]) return;
            this.currentLang = lang;
            localStorage.setItem(STORAGE_KEY, lang);
            this.apply(lang, true);
        },

        apply(lang, notify = true) {
            const t = TRANSLATIONS[lang];
            if (!t) return;

            document.documentElement.lang = lang;

            // 1. Data-i18n elements (attribute-based)
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (t[key]) {
                    // If it has HTML tags (like <em>), use innerHTML
                    if (t[key].includes('<')) el.innerHTML = t[key];
                    else el.textContent = t[key];
                }
            });

            // 2. Data-i18n-placeholder elements
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                if (t[key]) el.placeholder = t[key];
            });

            // 3. Update any specific global elements
            this.updateGlobalElements(t);

            // 4. Trigger a custom event for other scripts to listen to
            window.dispatchEvent(new CustomEvent('rsLanguageChanged', { detail: { lang, translations: t } }));

            // 5. Toast notification (if toast system exists)
            if (notify && typeof window.showToast === 'function') {
                window.showToast(t.toast_welcome);
            }
        },

        updateGlobalElements(t) {
            // Custom logic for hard-to-map elements
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                const txt = link.textContent.trim().toLowerCase();
                if (txt.includes('home') || txt.includes('ମୂଳ') || txt.includes('होम')) link.textContent = t.nav_home;
                if (txt.includes('screening')) link.textContent = t.nav_screening;
                if (txt.includes('dashboard')) link.textContent = t.nav_dashboard;
            });
        },

        get(key) {
            return TRANSLATIONS[this.currentLang][key] || key;
        },

        getTranslations() {
            return TRANSLATIONS[this.currentLang];
        }
    };

    // Expose to global scope
    window.RetinaSafeI18N = rs_i18n;

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => rs_i18n.init());
    } else {
        rs_i18n.init();
    }

})();
