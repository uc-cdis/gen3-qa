let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;

let assert = require('assert');


Feature('SubmitFileTest');

// Nodes in sorted (hierarchical) order
const nodes = [
  { // Study
    "data_description": "d3VZsWipsy64",
    "study_description": "S45t6kBh3PML",
    "study_setup": "Genotyping",
    "type_of_data": "Processed",
    "type": "study",
    "submitter_id": "study_001",
    "projects": {
      "code": "test"
    }
  },
  { // Case
    "cohort_id": "Surgical Donor",
    "amputation_type": "K8THZWcGkkqz",
    "index_date": "Cross Clamp",
    "site": "jvtvEcJ4xHN7",
    "eligibility": true,
    "transplanted_organ": "NsbF4DVqluDV",
    "type": "case",
    "submitter_id": "case_001",
    "studies": {
      "submitter_id": "study_001"
    }
  },
  { // Sample
    "pathology_notes": "m81kGqCbinRL",
    "oct_embedded": "yihvwwZGIyGT",
    "is_ffpe": false,
    "biospecimen_anatomic_site_detail": "Skin - Sun Exposed (Lower leg)",
    "biospecimen_anatomic_site": "Retina",
    "internal_notes": "sgAucMie7yiC",
    "method_of_sample_procurement": "Local Resection (Exoresection; wall resection)",
    "preservation_method": "Fresh",
    "tissue_type": "Normal",
    "hours_to_collection": 0,
    "prosector_notes": "8Y5i9v444l3C",
    "collection_site": "NUmgXEwYPN0a",
    "freezing_method": "ik7iqbpwiAnD",
    "biospecimen_physical_site": "LCfP0wrfaD11",
    "collection_kit": "Green Kit: Brain donation",
    "hours_to_sample_procurement": 4,
    "biospecimen_type": "HYovJ7kkG6TQ",
    "biospecimen_anatomic_site_uberon_term": "tTuluX3OS9Ln",
    "sample_type": "PAXgene Preserved tissue",
    "autolysis_score": "Mild",
    "biospecimen_anatomic_site_uberon_id": "bhqr8RSIOiwD",
    "current_weight": 16.4438,
    "composition": "Pleural Effusion",
    "type": "sample",
    "submitter_id": "sample_001",
    "cases": {
      "submitter_id": "case_001"
    }
  },
  { // Aliquot
    "aliquot_quantity": 6.7315,
    "aliquot_volume": 15.3402,
    "experiment_date": "UUcYhe3OKLBC",
    "analyte_isolation_batch_id": "gWzuA0czlJaE",
    "analyte_isolation_date": "yuDhWJw1C6Fg",
    "analyte_type": "YQGm0HoS8LJC",
    "amount": 10.493,
    "analyte_isolation_method": "qkhpuPOHZEBj",
    "exclude": false,
    "concentration": 13.7657,
    "experiment_batch_id": "oJjs2rm1gW4Z",
    "exclusion_criteria": "Sj2NVNs365sy",
    "experimental_strategy": "FBLvhkDdGAcw",
    "type": "aliquot",
    "submitter_id": "aliquot_001",
    "samples": {
      "submitter_id": "sample_001"
    }
  },
  { // Read Group
    "library_name": "lzVhCIAn75rz",
    "is_paired_end": false,
    "size_selection_range": "u4752q6YnSM3",
    "adapter_sequence": "Z45WuQyJeO2v",
    "library_strand": "First_Stranded",
    "library_preparation_kit_name": "Vv2J4iJwdJ0j",
    "adapter_name": "WJ7Fam9JdkEA",
    "target_capture_kit_name": "89QlddnsqumN",
    "includes_spike_ins": false,
    "library_preparation_kit_version": "oz5V35LGaRf0",
    "spike_ins_concentration": "x03seFzMTobJ",
    "read_length": 3,
    "spike_ins_fasta": "gk8UUG0BApYG",
    "to_trim_adapter_sequence": false,
    "RIN": 15.0241,
    "platform": "Other",
    "barcoding_applied": false,
    "library_selection": "Other",
    "library_strategy": "Exclude",
    "library_preparation_kit_catalog_number": "6Gn7brZAPP2Q",
    "target_capture_kit_target_region": "0XQvqM9up9JN",
    "target_capture_kit_version": "hlelYKsN4B0q",
    "read_group_name": "ZtpgrwKJuah2",
    "library_preparation_kit_vendor": "CbVB5E5MRxWl",
    "target_capture_kit_vendor": "kjsFB5oMEBTX",
    "target_capture_kit_catalog_number": "RRzTemFQ8TyS",
    "instrument_model": "AB SOLiD 2",
    "base_caller_name": "8wZdJBGzcDOi",
    "experiment_name": "P9hRE2kxROIE",
    "flow_cell_barcode": "4rcdXFY2RNwD",
    "sequencing_center": "QbxphSBZMhPw",
    "base_caller_version": "hnx4eVNcZe35",
    "type": "read_group",
    "submitter_id": "read_group_001",
    "aliquots": {
      "submitter_id": "aliquot_001"
    }
  },
];

const files = {
  test_file: {
    "data_category": "Sequencing Data",
    "data_type": "Unaligned Reads",
    "experimental_strategy": "WGS",
    "data_format": "BAM",
    "file_size": 4028481,
    "file_name": "H06JUADXX13011011.ATCACGAT.20k_reads.bam",
    "md5sum": "957e6a9857f5cafcfe1b0d5565e78ba9",
    "type": "submitted_unaligned_reads",
    "submitter_id": "submitted_unaligned_reads_001",
    "read_groups": {
      "submitter_id": "read_group_001"
    }
  }
};

Scenario('test submit file', async(I) => {
  I.submitFile("/api/v0/submission/dev/test/", files.test_file)
    .then(
      (res) => {
        console.log(res);
        let file_id = res.id;
        // TODO which attributes should I verify here?
        for (let key in res) {
          if (res.hasOwnProperty(key) && files.test_file.hasOwnProperty(key)){
            console.log(key);
            assert(res.key === files.test_file.key);
          }
        }

        assert(res.read_groups[0].submitter_id === files.test_file.read_groups.submitter_id);

        I.deleteFile(file_id);
      }
    );
});

BeforeSuite((I) => {
  I.addNodes("/api/v0/submission/dev/test/", Object.values(nodes))
});

AfterSuite((I) => {
  I.deleteNodes("/api/v0/submission/dev/test/", Object.values(nodes))
});
