import { createTestingPinia } from "@pinia/testing";
import { mount } from "@vue/test-utils";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { getLocalVue } from "tests/jest/helpers";

import { testDatatypesMapper } from "@/components/Datatypes/test_fixtures";
import { useDatatypesMapperStore } from "@/stores/datatypesMapperStore";

import HistoryDatasetDisplay from "./HistoryDatasetDisplay.vue";

const localVue = getLocalVue();

function setUpDatatypesStore() {
    const pinia = createTestingPinia({ stubActions: false });
    const datatypesStore = useDatatypesMapperStore();
    datatypesStore.datatypesMapper = testDatatypesMapper;
    return pinia;
}

describe("History Tabular Dataset Display", () => {
    let wrapper;
    let axiosMock;
    const datasetId = "someId";
    const tabular = { item_data: "29994\t-1.25\n37191\t-1.05\n36810\t2.08\n33320\t1.15" };
    const tabularMetaData = { metadata_columns: 2, metadata_data_lines: 4, file_ext: "tabular", name: "someName" };
    const tabularTableDataCounts = tabularMetaData.metadata_columns * tabularMetaData.metadata_data_lines;

    beforeEach(async () => {
        axiosMock = new MockAdapter(axios);
        axiosMock.onGet(`/api/datasets/${datasetId}`).reply(200, tabularMetaData);
        axiosMock.onGet(`/api/datasets/${datasetId}/get_content_as_text`).reply(200, tabular);

        wrapper = mount(HistoryDatasetDisplay, {
            localVue,
            propsData: { datasetId },
            pinia: setUpDatatypesStore(),
        });
    });

    afterEach(() => {
        axiosMock.restore();
    });

    it("should render table", () => {
        expect(wrapper.find("table").exists()).toBe(true);
        expect(wrapper.findAll("td").length).toBe(tabularTableDataCounts);
        expect(wrapper.findAll("th").length).toBe(tabularMetaData.metadata_columns);
    });
});

describe("History Text Dataset Display", () => {
    let wrapper;
    let axiosMock;
    const datasetId = "otherId";
    const text = { item_data: "some text" };
    const textMetaData = { file_ext: "txt", name: "someName" };

    beforeEach(async () => {
        axiosMock = new MockAdapter(axios);
        axiosMock.onGet(`/api/datasets/${datasetId}`).reply(200, textMetaData);
        axiosMock.onGet(`/api/datasets/${datasetId}/get_content_as_text`).reply(200, text);

        wrapper = mount(HistoryDatasetDisplay, {
            localVue,
            propsData: { datasetId },
            pinia: setUpDatatypesStore(),
        });
    });

    afterEach(() => {
        axiosMock.restore();
    });

    it("should render text", () => {
        const renderedText = wrapper.find(".word-wrap-normal");
        expect(renderedText.exists()).toBe(true);
        expect(renderedText.text()).toBe(text.item_data);
    });

    it("should render header with embedded true", async () => {
        expect(wrapper.find(".card-header").exists()).toBe(true);
        await wrapper.setProps({ embedded: true });
        expect(wrapper.find(".card-header").exists()).toBe(false);
    });

    it("should expand dataset", async () => {
        const expandBTN = wrapper.find('.btn[title="Expand"]');
        expect(expandBTN.exists()).toBe(true);
        expect(wrapper.find(".embedded-dataset").exists()).toBe(true);

        await expandBTN.trigger("click");

        expect(wrapper.find('.btn[title="Collapse"]').exists()).toBe(true);
        expect(wrapper.find(".embedded-dataset-expanded").exists()).toBe(true);
    });
});
