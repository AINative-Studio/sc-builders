"""Human-friendly metadata for the SC community data (lakehouse) endpoints.

The raw lakehouse exposes cryptic series codes (e.g. ``CASANT3POP``) and bare
column names. This catalog maps them to labels, units, and short descriptions so
that both the UI and developers calling ``/api/data/*`` get self-describing,
presentation-ready responses.

Everything degrades gracefully: unknown series fall back to a readable default
rather than an error.
"""

from __future__ import annotations

# --- FRED / Census economic series (Santa Cruz County, FIPS 06087) ----------
# Only the series worth surfacing get a rich entry; the rest fall back to
# ``fallback_series_label`` so nothing shows a raw code without a label.

ECONOMIC_SERIES: dict[str, dict[str, str]] = {
    "CASANT3POP": {"label": "Resident Population", "unit": "thousands of persons",
                   "description": "Total resident population of Santa Cruz County.", "category": "Demographics"},
    "CASANT3URN": {"label": "Unemployment Rate", "unit": "%",
                   "description": "Share of the labor force that is unemployed.", "category": "Labor"},
    "CASANT3LFN": {"label": "Labor Force", "unit": "persons",
                   "description": "Size of the civilian labor force.", "category": "Labor"},
    "MHICA06087A052NCEN": {"label": "Median Household Income", "unit": "USD",
                           "description": "Estimated median household income.", "category": "Income"},
    "MHICILBCA06087A052NCEN": {"label": "Median Household Income (lower bound)", "unit": "USD",
                               "description": "Lower bound of the median household income estimate.", "category": "Income"},
    "PCPI06087": {"label": "Per Capita Personal Income", "unit": "USD",
                  "description": "Personal income divided by population.", "category": "Income"},
    "GDPALL06087": {"label": "Gross Domestic Product (all industries)", "unit": "thousands of USD",
                    "description": "Total county GDP across all industries.", "category": "Output"},
    "REALGDPALL06087": {"label": "Real GDP (all industries)", "unit": "thousands of chained USD",
                        "description": "Inflation-adjusted county GDP.", "category": "Output"},
    "REALGDPGOVT06087": {"label": "Real GDP — Government", "unit": "thousands of chained USD",
                         "description": "Inflation-adjusted GDP from government activity.", "category": "Output"},
    "MEDLISPRI6087": {"label": "Median Listing Price", "unit": "USD",
                      "description": "Median home listing price in the county.", "category": "Housing"},
    "MEDLISPRIPERSQUFEE6087": {"label": "Median Listing Price / Sq Ft", "unit": "USD/sq ft",
                               "description": "Median listing price per square foot.", "category": "Housing"},
    "MEDSQUFEE6087": {"label": "Median Home Size", "unit": "sq ft",
                      "description": "Median square footage of listed homes.", "category": "Housing"},
    "MEDDAYONMAR6087": {"label": "Median Days on Market", "unit": "days",
                        "description": "Median number of days homes stay listed.", "category": "Housing"},
    "ACTLISCOU6087": {"label": "Active Listing Count", "unit": "listings",
                      "description": "Number of active home listings.", "category": "Housing"},
    "NEWLISCOUMM6087": {"label": "New Listings (monthly)", "unit": "listings",
                        "description": "New home listings added, month over month.", "category": "Housing"},
    "HOWNRATEACS006087": {"label": "Homeownership Rate", "unit": "%",
                          "description": "Share of occupied homes that are owner-occupied.", "category": "Housing"},
    "ATNHPIUS06087A": {"label": "House Price Index", "unit": "index",
                       "description": "All-transactions house price index (annual).", "category": "Housing"},
    "S1701ACS006087": {"label": "Poverty — Population Below Poverty", "unit": "persons",
                       "description": "Estimated population living below the poverty line.", "category": "Income"},
    "NETMIGNACS006087": {"label": "Net Migration", "unit": "persons",
                         "description": "Net population change from migration.", "category": "Demographics"},
    "EQFXSUBPRIME006087": {"label": "Subprime Credit Population", "unit": "%",
                           "description": "Share of the population with subprime credit scores.", "category": "Credit"},
    "USPTOISSUED006087": {"label": "Patents Issued", "unit": "patents",
                          "description": "USPTO patents issued to county residents.", "category": "Innovation"},
}


def series_meta(series_id: str) -> dict[str, str]:
    """Return rich metadata for an economic series, with a graceful fallback."""
    if series_id in ECONOMIC_SERIES:
        return {"series_id": series_id, **ECONOMIC_SERIES[series_id]}
    return {
        "series_id": series_id,
        "label": series_id,  # last resort — still shows the code, but flagged
        "unit": "",
        "description": "FRED/Census series (label not yet catalogued).",
        "category": "Other",
    }


# --- Column-level metadata for the tabular datasets --------------------------
# label = human header, unit = optional unit shown next to values.

COLUMN_META: dict[str, dict[str, dict[str, str]]] = {
    "businesses": {
        "business_name": {"label": "Business"},
        "dba": {"label": "DBA (Doing Business As)"},
        "category": {"label": "Category"},
        "naics": {"label": "NAICS Code", "description": "North American Industry Classification code."},
        "address": {"label": "Address"},
        "city": {"label": "City"},
        "state": {"label": "State"},
        "zip": {"label": "ZIP"},
        "phone": {"label": "Phone"},
        "business_type": {"label": "Business Type"},
        "is_tech": {"label": "Tech Business", "description": "Whether classified as a technology business."},
    },
    "housing": {
        "region": {"label": "Region"},
        "date": {"label": "Date"},
        "zhvi": {"label": "Home Value (ZHVI)", "unit": "USD",
                 "description": "Zillow Home Value Index — typical home value for the region."},
    },
    "parcels": {
        "apn": {"label": "Parcel Number (APN)", "description": "Assessor's Parcel Number."},
        "address": {"label": "Address"},
        "full_address": {"label": "Full Address"},
        "city": {"label": "City"},
        "zip": {"label": "ZIP"},
        "use_description": {"label": "Land Use"},
        "zoning": {"label": "Zoning"},
        "base_zoning": {"label": "Base Zoning"},
        "homeowner_exempt": {"label": "Homeowner Exemption"},
    },
    "traffic": {
        "route": {"label": "Highway Route"},
        "district": {"label": "Caltrans District"},
        "post_mile": {"label": "Post Mile"},
        "back_aadt": {"label": "Traffic Behind (AADT)", "unit": "vehicles/day",
                      "description": "Annual Average Daily Traffic on the back segment."},
        "ahead_aadt": {"label": "Traffic Ahead (AADT)", "unit": "vehicles/day",
                       "description": "Annual Average Daily Traffic on the ahead segment."},
        "latitude": {"label": "Latitude"},
        "longitude": {"label": "Longitude"},
    },
    "safety": {
        "type": {"label": "Incident Type"},
        "description": {"label": "Description"},
        "date": {"label": "Date"},
        "address": {"label": "Address"},
        "latitude": {"label": "Latitude"},
        "longitude": {"label": "Longitude"},
        "agency": {"label": "Reporting Agency"},
    },
}

DATASET_DESCRIPTIONS: dict[str, str] = {
    "businesses": "Registered small & medium businesses in Santa Cruz County (~290K records).",
    "housing": "Zillow Home Value Index (ZHVI) trends for Santa Cruz County regions.",
    "economic": "FRED & Census economic indicators for Santa Cruz County (income, labor, GDP, housing).",
    "parcels": "County assessor parcels — land use, zoning, and ownership (~97K records).",
    "traffic": "Caltrans Annual Average Daily Traffic (AADT) counts on state highways.",
    "safety": "Crime and safety incidents reported across Santa Cruz County agencies.",
}


def column_meta(dataset: str, columns: list[str]) -> list[dict[str, str]]:
    """Build ordered column metadata for a dataset's response."""
    table = COLUMN_META.get(dataset, {})
    out = []
    for col in columns:
        m = table.get(col, {"label": col.replace("_", " ").title()})
        out.append({"key": col, **m})
    return out
