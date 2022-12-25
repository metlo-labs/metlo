import { DataClass } from "@common/types";
import axios, { AxiosRequestHeaders } from "axios";
import { useEffect, useState } from "react";
import { getAPIURL } from "~/constants";

interface fetchDataClassesInterface {
    headers?: AxiosRequestHeaders,
    setLocal?: boolean
}

export async function getDataClasses({ headers, setLocal }: fetchDataClassesInterface) {
    const dataClassInfo = await axios.get<DataClass[]>(`${getAPIURL()}/data-class`, { headers })
    if (setLocal) {
        window.localStorage.setItem("DataClassInfo", JSON.stringify(dataClassInfo.data))
    }
    return dataClassInfo.data
}


export function fetchDataClassesHook(): [DataClass[], boolean] {
    const [fetching, setFetching] = useState(true);
    const [dataClasses, setDataClasses] = useState<DataClass[]>([]);

    useEffect(() => {
        setFetching(true)
        axios.get<DataClass[]>(`${getAPIURL()}/data-class`)
            .then(
                (res) => setDataClasses(res.data)
            ).catch(
                err => console.log(err)
            ).finally(
                () => setFetching(false)
            )

    }, []);

    return [dataClasses, fetching];
}