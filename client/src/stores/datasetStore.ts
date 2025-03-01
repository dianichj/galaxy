import { defineStore } from "pinia";
import { computed, set } from "vue";

import { type HDADetailed, type HistoryContentItemBase, isInaccessible } from "@/api";
import { fetchDatasetDetails } from "@/api/datasets";
import { useKeyedCache } from "@/composables/keyedCache";

const NON_TERMINAL_STATES = ["new", "queued", "running", "setting_metadata", "waiting"];

export const useDatasetStore = defineStore("datasetStore", () => {
    const shouldFetch = computed(() => {
        return (dataset?: HDADetailed) => {
            if (!dataset) {
                return true;
            }
            if (isInaccessible(dataset)) {
                return false;
            }
            return NON_TERMINAL_STATES.includes(dataset.state);
        };
    });

    const { storedItems, getItemById, getItemLoadError, isLoadingItem, fetchItemById } = useKeyedCache<HDADetailed>(
        fetchDatasetDetails,
        shouldFetch
    );

    function saveDatasets(historyContentsPayload: HistoryContentItemBase[]) {
        const datasetList = historyContentsPayload.filter(
            (entry) => entry.history_content_type === "dataset"
        ) as HDADetailed[];
        for (const dataset of datasetList) {
            set(storedItems.value, dataset.id, dataset);
        }
    }

    return {
        storedDatasets: storedItems,
        getDataset: getItemById,
        getDatasetError: getItemLoadError,
        isLoadingDataset: isLoadingItem,
        fetchDataset: fetchItemById,
        saveDatasets,
    };
});
