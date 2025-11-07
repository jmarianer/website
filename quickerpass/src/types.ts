export type PersonalInfo = {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  gender: string;
  birthdate: string;
}

export const questions = {
  A070: "Dummy question, just say yes",
  A001: "Are you feeling healthy and well today?",
  A002: "Are you currently taking an antibiotic?",
  A003: "Are you currently taking any other medication for an infection?",
  A088: "Are you pregnant now?",
  A077: "Have you taken any medications on the Medication Deferral List in the time frames indicated?",
  A074: "Have you read the blood donor educational materials today?",
  A008: "In the past 48 hours, have you taken aspirin or anything that has aspirin in it?",
  A012: "In the past 8 weeks, have you donated blood, platelets or plasma?",
  A017: "In the past 8 weeks, have you had any vaccinations or other shots?",
  A079: "In the past 8 weeks, have you had contact with someone who was vaccinated for smallpox in the past 8 weeks?",
  A086: "In the past 3 months, have you taken any medication by mouth(oral) to prevent an HIV infection? (i.e., PrEP or PEP)",
  A089: "In the past 3 months, have you had sexual contact with a new partner ? (Refer to the examples of \"new partner\" in the Blood Donor Educational Material)",
  A090: "In the past 3 months, have you had sexual contact with more than one partner?",
  A025: "In the past 3 months, have you had sexual contact with anyone who has ever had a positive test for HIV infection?",
  A080: "In the past 3 months, have you received money, drugs, or other payment for sex?",
  A026: "In the past 3 months, have you had sexual contact with anyone who has, in the past 3 months, received money, drugs, or other payment for sex?",
  A044: "In the past 3 months, have you used needles to inject drugs, steroids, or anything not prescribed by your doctor?",
  A027: "In the past 3 months, have you had sexual contact with anyone who has used needles in the past 3 months to inject drugs, steroids, or anything not prescribed by their doctor?",
  A034: "In the past 3 months, have you had syphilis or gonorrhea or been treated for syphilis or gonorrhea?",
  A030: "In the past 3 months, have you had sexual contact with a person who has hepatitis?",
  A031: "In the past 3 months, have you lived with a person who has hepatitis?",
  A024: "In the past 3 months, have you had an accidental needle- stick?",
  A023: "In the past 3 months, have you come into contact with someone else's blood?",
  A032: "In the past 3 months, have you had a tattoo?",
  A033: "In the past 3 months, have you had ear or body piercing?",
  A020: "In the past 3 months, have you had a blood transfusion?",
  A021: "In the past 3 months, have you had a transplant such as organ, tissue or bone marrow?",
  A022: "In the past 3 months, have you had a graft such as bone or skin?",
  A019: "In the past 16 weeks, have you donated a double unit of red blood cells using an apheresis machine?",
  A060: "In the past 12 months, have you been in juvenile detention, lockup, jail, or prison for 72 hours or more consecutively?",
  A091: "In the past 2 years, have you received any medication by injection to prevent HIV infection ? (i.e., long - acting antiviral PrEP or PEP)?",
  A036: "In the past 3 years, have you been outside the United States or Canada?",
  A043: "Have you EVER had a positive test for HIV infection?",
  A087: "Have you EVER taken any medication to treat HIV infection?",
  A093: "Have you EVER been pregnant?",
  A047: "Have you EVER had malaria?",
  A081: "Have you EVER received a dura mater(or brain covering) graft or xenotransplantation product?",
  A051: "Have you EVER had any type of cancer, including leukemia?",
  A052: "Have you EVER had any problems with your heart or lungs?",
  A053: "Have you EVER had a bleeding condition or a blood disease?",
  A049: "Have you EVER had a positive test result for Babesia?",
  A092: "(Study Purposes Only) Have you EVER had a blood transfusion?",
  A094: "My responses to the donor history questionnaire are accurate and true. I understand my blood will be tested for transfusion - transmitted infections including HIV and hepatitis. If my donation or test results lead to my deferral from donation, my donor record will be updated accordingly. I will be notified of the basis for and period of deferral. I reviewed the information provided relating to donation procedure risks. My donation is voluntary. I understand I have the right to refuse or discontinue the donation at any time. I understand the information presented, including potential uses of my donation. My questions have been answered and I agree to donate.",
};

export type Answers = Partial<Record<keyof typeof questions, 'Y' | 'N'>>;
