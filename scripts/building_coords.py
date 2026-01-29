# CSULB building code -> (full_name, latitude, longitude)
# Coordinates are approximate and should be verified against Google Maps.
# To find a building's coordinates: search "CSULB [building name]" in Google Maps,
# right-click the building, and copy the lat/lng.

BUILDING_DATA: dict[str, tuple[str, float, float]] = {
    # Engineering & Computer Science
    "ECS": ("Engineering & Computer Science", 33.7834, -118.1105),
    "VEC": ("Vivian Engineering Center", 33.7831, -118.1102),
    "EN2": ("Engineering 2", 33.7836, -118.1112),
    "ET": ("Engineering & Technology", 33.7840, -118.1098),

    # Liberal Arts
    "LA1": ("Liberal Arts 1", 33.7775, -118.1140),
    "LA2": ("Liberal Arts 2", 33.7770, -118.1135),
    "LA3": ("Liberal Arts 3", 33.7772, -118.1138),
    "LA4": ("Liberal Arts 4", 33.7773, -118.1143),
    "LA5": ("Liberal Arts 5", 33.7776, -118.1146),

    # Science & Math
    "MLSC": ("Molecular & Life Science Center", 33.7821, -118.1122),
    "MIC": ("Microbiology", 33.7815, -118.1123),
    "HSCI": ("Hall of Science", 33.7808, -118.1118),
    "PH1": ("Peterson Hall 1", 33.7790, -118.1128),
    "PH2": ("Peterson Hall 2", 33.7792, -118.1125),

    # Health & Human Services
    "HHS1": ("Health & Human Services 1", 33.7813, -118.1148),
    "HHS2": ("Health & Human Services 2", 33.7810, -118.1145),
    "FCS": ("Family & Consumer Sciences", 33.7796, -118.1098),
    "KIN": ("Kinesiology", 33.7866, -118.1117),

    # Education
    "EED": ("Education", 33.7785, -118.1090),
    "ED2": ("Education 2", 33.7783, -118.1087),

    # Arts
    "FA1": ("Fine Arts 1", 33.7755, -118.1090),
    "FA2": ("Fine Arts 2", 33.7757, -118.1088),
    "FA3": ("Fine Arts 3", 33.7753, -118.1092),
    "FA4": ("Fine Arts 4", 33.7751, -118.1094),
    "TA": ("Theater Arts", 33.7758, -118.1095),
    "MM": ("McIntosh Music", 33.7760, -118.1086),
    "UAM": ("University Art Museum", 33.7748, -118.1098),
    "UT": ("University Theater", 33.7756, -118.1092),
    "DESN": ("Design", 33.7752, -118.1085),

    # Business
    "COB": ("College of Business", 33.7798, -118.1155),

    # Lecture Halls & General
    "LH": ("Lecture Hall", 33.7779, -118.1117),
    "AS": ("Academic Services", 33.7788, -118.1160),
    "SSC": ("Student Success Center", 33.7773, -118.1151),
    "HC": ("Horn Center", 33.7795, -118.1120),
    "PSY": ("Psychology", 33.7804, -118.1140),
    "SPA": ("Social & Public Affairs", 33.7802, -118.1090),

    # Library
    "LIB": ("University Library", 33.7808, -118.1130),

    # Student Union & Recreation
    "USU": ("University Student Union", 33.7838, -118.1135),
    "SRWC": ("Student Recreation & Wellness Center", 33.7860, -118.1125),

    # Nursing
    "NURS": ("Nursing", 33.7812, -118.1150),
    "NUR": ("Nursing", 33.7812, -118.1150),

    # Additional buildings found during scraping
    "CINE": ("Cinema & Television Arts", 33.7758, -118.1082),
    "CPCE": ("College of Professional & Continuing Education", 33.7845, -118.1147),
    "DC": ("Dance Center", 33.7760, -118.1075),
    "EN3": ("Engineering 3", 33.7838, -118.1115),
    "EN4": ("Engineering 4", 33.7839, -118.1118),
    "FO2": ("Foundation 2", 33.7780, -118.1155),
    "HSD": ("Human Services & Design", 33.7805, -118.1095),
    "LAB": ("Laboratory Building", 33.7818, -118.1125),
    "MHB": ("McIntosh Humanities Building", 33.7765, -118.1090),
    "UMC": ("University Music Center", 33.7762, -118.1082),
}

# Locations to skip — not real buildings/classrooms
SKIP_LOCATIONS = {
    "ONLINE-ONLY",
    "OFF-CAMP",
    "TBA",
    "NA",
    "",
}

# Outdoor/athletic venues — not useful as study spaces
SKIP_BUILDING_CODES = {
    "CTS",  # Courts (tennis)
    "FLD",  # Athletic fields
    "RNG",  # Range
    "SWM",  # Swimming pool
}
