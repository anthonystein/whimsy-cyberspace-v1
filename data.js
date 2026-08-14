const WHIMSY_DATA = {
  phases: {
    observe: { index:'01 / 05', name:'Observe', thesis:'See how the work behaves in real life.', owner:'David + AI', output:'Notice friction before building.', functions:['rnd','operations','marketing','sales','inventory','hr','finance','ecommerce'] },
    capture: { index:'02 / 05', name:'Capture', thesis:'Turn knowledge into assets.', owner:'David + AI', output:'A library of systems, not ideas.', functions:['rnd','operations','marketing'] },
    enable: { index:'03 / 05', name:'Enable', thesis:'Make the knowledge usable.', owner:'David + Team', output:'Customers and staff operate from the same source of truth.', functions:['sales','ecommerce','marketing'] },
    stabilize: { index:'04 / 05', name:'Stabilize', thesis:'Build consistency around the system.', owner:'Leadership + Team', output:'The business becomes predictable instead of person-dependent.', functions:['hr','inventory','operations'] },
    compound: { index:'05 / 05', name:'Compound', thesis:'Reinvest in what works.', owner:'Leadership', output:'Every improvement makes the next one easier.', functions:['finance','rnd'] }
  },
  functions: {
    sales:{number:'FUNCTION 01',name:'Sales',icon:'assets/icons/sales.svg',thesis:'Turn expertise into trust.',destination:'Higher conversions and lifelong customers.',roles:[{phase:'Enable',action:'Use the systems with customers.',owner:'Team'}],missions:[
      {name:'Build the consultation playbook',phase:'Enable',owner:'David + Team',problem:'Great advice changes depending on who is at the counter.',deliverable:'A concise consultation path staff can actually use.',proof:'A customer gets consistent guidance without needing one specific expert.'},
      {name:'Map the customer decision path',phase:'Enable',owner:'David + AI',problem:'Customers often enter with a product question when they really have a decision problem.',deliverable:'A simple map from situation to recommendation.',proof:'Fewer repeated questions and clearer next steps.'},
      {name:'Create the follow-up standard',phase:'Stabilize',owner:'Leadership + Team',problem:'High-value conversations disappear after the customer leaves.',deliverable:'A lightweight follow-up rhythm.',proof:'More opportunities continue instead of resetting.'}
    ]},
    marketing:{number:'FUNCTION 02',name:'Marketing',icon:'assets/icons/marketing.svg',thesis:'Teach before selling.',destination:'Sustainable demand and brand authority.',roles:[{phase:'Capture',action:'Turn captured knowledge into content.',owner:'David + AI'},{phase:'Enable',action:'Continue educating the market.',owner:'David + Team'}],missions:[
      {name:'Build the Stain Decision Library',phase:'Capture',owner:'David + AI',problem:'Homeowners choose stain products before diagnosing the deck.',deliverable:'A decision-first education library.',proof:'Customers arrive knowing what questions matter.'},
      {name:'Turn store questions into content',phase:'Capture',owner:'David + AI',problem:'The same useful explanation is repeated but never retained.',deliverable:'A repeatable capture-to-content workflow.',proof:'One answer becomes useful many times.'},
      {name:'Connect QR education to the website',phase:'Enable',owner:'David + Team',problem:'Store expertise ends when the conversation ends.',deliverable:'Physical-to-digital education touchpoints.',proof:'Customers can continue learning without another interruption.'}
    ]},
    operations:{number:'FUNCTION 03',name:'Operations',icon:'assets/icons/operations.svg',thesis:'Replace memory with systems.',destination:'Consistent execution at scale.',roles:[{phase:'Capture',action:'Document how the work actually happens.',owner:'David + AI'},{phase:'Stabilize',action:'Refine the system through use.',owner:'Leadership + Team'}],missions:[
      {name:'Map opening and closing routines',phase:'Capture',owner:'David + AI',problem:'Daily standards depend on who remembers what.',deliverable:'A visible opening and closing system.',proof:'The store starts and ends consistently without reminders.'},
      {name:'Route recurring inbox work',phase:'Capture',owner:'David + AI',problem:'Repeated email work lands on the wrong person or lives in memory.',deliverable:'Simple ownership and routing rules.',proof:'Less re-forwarding, chasing and duplicated effort.'},
      {name:'Define stable store standards',phase:'Stabilize',owner:'Leadership + Team',problem:'Good habits drift when they are implicit.',deliverable:'A short operational standard the team can maintain.',proof:'Consistency survives changes in staffing and workload.'}
    ]},
    inventory:{number:'FUNCTION 04',name:'Inventory',icon:'assets/icons/inventory.svg',thesis:'Make the physical inventory match the digital inventory.',destination:'Better cash flow and fewer errors.',roles:[{phase:'Stabilize',action:'Align physical reality with the documented process.',owner:'Leadership + Team'}],missions:[
      {name:'Watch the top 50 SKUs',phase:'Stabilize',owner:'Team + Leadership',problem:'High-impact stock errors are discovered too late.',deliverable:'A repeatable watch process for the most important SKUs.',proof:'Recurring differences are caught and explained earlier.'},
      {name:'Test cycle-count controls',phase:'Stabilize',owner:'Team',problem:'Full counts are too heavy to be the only control.',deliverable:'A small cycle-count routine.',proof:'Accuracy improves without stopping the business.'},
      {name:'Trace recurring stock differences',phase:'Stabilize',owner:'David + Team',problem:'Adjustments fix the number but not the cause.',deliverable:'A short root-cause log tied to recurring variances.',proof:'The same discrepancy happens less often.'}
    ]},
    hr:{number:'FUNCTION 05',name:'Human Resources',icon:'assets/icons/hr.svg',thesis:'Build people who can build the business.',destination:'A self-sustaining, high-performing team.',roles:[{phase:'Stabilize',action:'Train and coach people on the systems.',owner:'Leadership'}],missions:[
      {name:'Design role scorecards',phase:'Stabilize',owner:'Leadership',problem:'Responsibilities can be understood differently by each person.',deliverable:'A visible definition of success for each role.',proof:'Coaching becomes specific instead of subjective.'},
      {name:'Build the store learning path',phase:'Stabilize',owner:'Leadership + AI',problem:'New staff learn through scattered interruptions.',deliverable:'A sequenced path from first day to independent contribution.',proof:'Training becomes repeatable and less person-dependent.'},
      {name:'Create a feedback rhythm',phase:'Stabilize',owner:'Leadership',problem:'Small performance issues wait until they become larger conversations.',deliverable:'A lightweight recurring feedback cadence.',proof:'Course correction happens earlier.'}
    ]},
    finance:{number:'FUNCTION 06',name:'Finance',icon:'assets/icons/finance.svg',thesis:'Allocate capital to the highest-leverage opportunities.',destination:'Faster, healthier long-term growth.',roles:[{phase:'Compound',action:'Reinvest in the systems that produce leverage.',owner:'Leadership'}],missions:[
      {name:'Build the decision dashboard',phase:'Compound',owner:'David + AI',problem:'Useful financial signals live across reports instead of decisions.',deliverable:'A small set of operating signals tied to action.',proof:'Leaders can tell what needs attention without rebuilding the analysis.'},
      {name:'Map margin by channel',phase:'Compound',owner:'David + AI',problem:'Revenue growth can hide where value is actually being created.',deliverable:'A channel-level margin view.',proof:'Capital follows profitable leverage, not activity alone.'},
      {name:'Define capital-allocation rules',phase:'Compound',owner:'Leadership',problem:'Investment decisions can become reactive.',deliverable:'Simple rules for where incremental capital goes first.',proof:'Good opportunities are funded faster and weak ones are easier to decline.'}
    ]},
    ecommerce:{number:'FUNCTION 07',name:'E-commerce',icon:'assets/icons/ecommerce.svg',thesis:'Make Primetime’s expertise available anywhere.',destination:'Revenue beyond the store.',roles:[{phase:'Enable',action:'Publish the systems online.',owner:'David + Team'}],missions:[
      {name:'Improve deep-product landing pages',phase:'Enable',owner:'David + AI',problem:'Product pages list products without transferring expertise.',deliverable:'Decision-first pages for high-consideration products.',proof:'Visitors can move forward without calling for basic context.'},
      {name:'Build online decision tools',phase:'Enable',owner:'David + AI',problem:'Complex purchases are difficult to translate into a normal catalog.',deliverable:'Interactive tools that diagnose before recommending.',proof:'Online visitors reach a smaller, more relevant choice set.'},
      {name:'Create specialist intake flows',phase:'Enable',owner:'David + Team',problem:'High-value inquiries arrive without enough context.',deliverable:'Structured intake before expert follow-up.',proof:'The first human conversation starts further ahead.'}
    ]},
    rnd:{number:'FUNCTION 08',name:'Research & Development',icon:'assets/icons/rnd.svg',thesis:'Capture knowledge once and reuse it forever.',destination:'A compounding competitive advantage.',roles:[{phase:'Observe',action:'Study repeated questions, friction and expertise.',owner:'David + AI'},{phase:'Capture',action:'Capture and structure expertise.',owner:'David + AI'},{phase:'Compound',action:'Build the next layer from what worked.',owner:'Leadership + AI'}],missions:[
      {name:'Build the verified source library',phase:'Capture',owner:'David + AI',problem:'Technical knowledge is scattered across people, PDFs and manufacturer sites.',deliverable:'A verified, consistently named source library.',proof:'A person or model can retrieve the right source quickly.'},
      {name:'Break the retrieval model',phase:'Capture',owner:'David + AI',problem:'A knowledge system only looks useful until real questions expose its gaps.',deliverable:'A test set of real staff questions and failure cases.',proof:'Retrieval improves against known misses.'},
      {name:'Standardize product intelligence',phase:'Compound',owner:'David + AI',problem:'Useful product knowledge is captured in inconsistent forms.',deliverable:'A reusable schema for product intelligence.',proof:'New product knowledge plugs into the same system faster.'}
    ]}
  }
};

if (typeof window !== 'undefined') window.WHIMSY_DATA = WHIMSY_DATA;
if (typeof module !== 'undefined' && module.exports) module.exports = WHIMSY_DATA;
