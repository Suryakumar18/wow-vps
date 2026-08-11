/**
 * Indian states / union territories with their larger cities and towns, for
 * the address form's State → City selects. Not exhaustive — the form offers
 * "Other city…" with a free-text input for anywhere not listed, so a missing
 * town never blocks a checkout.
 */
export const INDIAN_STATES: { name: string; cities: string[] }[] = [
  { name: "Andaman and Nicobar Islands", cities: ["Port Blair"] },
  {
    name: "Andhra Pradesh",
    cities: [
      "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry",
      "Tirupati", "Kakinada", "Kadapa", "Anantapur", "Eluru", "Ongole", "Chittoor",
      "Machilipatnam", "Srikakulam",
    ],
  },
  { name: "Arunachal Pradesh", cities: ["Itanagar", "Naharlagun", "Pasighat", "Tawang"] },
  {
    name: "Assam",
    cities: [
      "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur",
      "Bongaigaon", "Karimganj",
    ],
  },
  {
    name: "Bihar",
    cities: [
      "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif",
      "Arrah", "Begusarai", "Katihar", "Chhapra", "Sasaram", "Hajipur",
    ],
  },
  { name: "Chandigarh", cities: ["Chandigarh"] },
  {
    name: "Chhattisgarh",
    cities: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Jagdalpur", "Raigarh"],
  },
  { name: "Dadra and Nagar Haveli and Daman and Diu", cities: ["Daman", "Diu", "Silvassa"] },
  { name: "Delhi", cities: ["New Delhi", "Delhi", "Dwarka", "Rohini", "Karol Bagh", "Saket"] },
  { name: "Goa", cities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"] },
  {
    name: "Gujarat",
    cities: [
      "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar",
      "Junagadh", "Anand", "Navsari", "Morbi", "Nadiad", "Bharuch", "Vapi", "Gandhidham",
    ],
  },
  {
    name: "Haryana",
    cities: [
      "Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar",
      "Karnal", "Sonipat", "Panchkula", "Bhiwani", "Sirsa", "Rewari",
    ],
  },
  {
    name: "Himachal Pradesh",
    cities: ["Shimla", "Mandi", "Solan", "Dharamshala", "Baddi", "Kullu", "Hamirpur", "Una"],
  },
  {
    name: "Jammu and Kashmir",
    cities: ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur", "Kathua"],
  },
  {
    name: "Jharkhand",
    cities: [
      "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar", "Hazaribagh",
      "Giridih", "Ramgarh",
    ],
  },
  {
    name: "Karnataka",
    cities: [
      "Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi", "Kalaburagi", "Davanagere",
      "Ballari", "Vijayapura", "Shivamogga", "Tumakuru", "Udupi", "Hassan", "Bidar", "Raichur",
    ],
  },
  {
    name: "Kerala",
    cities: [
      "Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Alappuzha",
      "Palakkad", "Kannur", "Kottayam", "Malappuram", "Pathanamthitta", "Kasaragod",
    ],
  },
  { name: "Ladakh", cities: ["Leh", "Kargil"] },
  { name: "Lakshadweep", cities: ["Kavaratti"] },
  {
    name: "Madhya Pradesh",
    cities: [
      "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna",
      "Ratlam", "Rewa", "Katni", "Singrauli", "Burhanpur", "Khandwa",
    ],
  },
  {
    name: "Maharashtra",
    cities: [
      "Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati",
      "Kolhapur", "Navi Mumbai", "Sangli", "Jalgaon", "Akola", "Latur", "Nanded",
      "Ahmednagar", "Chandrapur", "Dhule",
    ],
  },
  { name: "Manipur", cities: ["Imphal", "Thoubal", "Bishnupur"] },
  { name: "Meghalaya", cities: ["Shillong", "Tura", "Jowai"] },
  { name: "Mizoram", cities: ["Aizawl", "Lunglei", "Champhai"] },
  { name: "Nagaland", cities: ["Kohima", "Dimapur", "Mokokchung"] },
  {
    name: "Odisha",
    cities: [
      "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore",
      "Bhadrak", "Baripada", "Jharsuguda",
    ],
  },
  { name: "Puducherry", cities: ["Puducherry", "Karaikal", "Yanam", "Mahe"] },
  {
    name: "Punjab",
    cities: [
      "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Hoshiarpur",
      "Batala", "Pathankot", "Moga", "Abohar", "Khanna",
    ],
  },
  {
    name: "Rajasthan",
    cities: [
      "Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar",
      "Sikar", "Sri Ganganagar", "Pali", "Barmer", "Chittorgarh",
    ],
  },
  { name: "Sikkim", cities: ["Gangtok", "Namchi", "Gyalshing"] },
  {
    name: "Tamil Nadu",
    cities: [
      "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli",
      "Tiruppur", "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Hosur",
      "Nagercoil", "Kancheepuram", "Karur", "Cuddalore", "Kumbakonam", "Namakkal",
      "Tiruvannamalai", "Pollachi", "Rajapalayam", "Sivakasi", "Pudukkottai", "Ariyalur",
      "Perambalur", "Thuraiyur", "Villupuram", "Krishnagiri", "Dharmapuri", "Theni",
      "Virudhunagar", "Ramanathapuram", "Sivaganga", "Nilgiris (Ooty)", "Tenkasi",
      "Chengalpattu", "Tirupathur", "Ranipet", "Kallakurichi", "Mayiladuthurai",
    ],
  },
  {
    name: "Telangana",
    cities: [
      "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam",
      "Mahbubnagar", "Nalgonda", "Secunderabad", "Siddipet", "Suryapet",
    ],
  },
  { name: "Tripura", cities: ["Agartala", "Udaipur (Tripura)", "Dharmanagar"] },
  {
    name: "Uttar Pradesh",
    cities: [
      "Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Prayagraj",
      "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Gorakhpur", "Noida",
      "Greater Noida", "Firozabad", "Jhansi", "Muzaffarnagar", "Mathura", "Ayodhya",
      "Rampur", "Shahjahanpur",
    ],
  },
  {
    name: "Uttarakhand",
    cities: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Nainital"],
  },
  {
    name: "West Bengal",
    cities: [
      "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda",
      "Kharagpur", "Haldia", "Krishnanagar", "Darjeeling", "Jalpaiguri",
    ],
  },
];

export const OTHER_CITY = "Other city…";
