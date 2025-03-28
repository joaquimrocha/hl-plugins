import {
  HoverInfoLabel,
  Link,
  SectionBox,
  ShowHideLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject, KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { localeDate, timeAgo } from '@kinvolk/headlamp-plugin/lib/Utils';
import Table from '../common/Table';
import { PluralName } from './pluralName';

export function getSourceNameAndPluralKind(item: KubeObject): {
  name: string;
  pluralKind: string;
  namespace: string | undefined;
} {
  const itemKind = item.jsonData.kind;
  let pluralKind = '';
  let name = '';
  let namespace: string | undefined;

  if (itemKind === 'Kustomization') {
    pluralKind = PluralName(item.jsonData.spec.sourceRef.kind);
    name = item.jsonData.spec?.sourceRef?.name;
    namespace = item.jsonData.spec.sourceRef.namespace;
  } else if (itemKind === 'HelmRelease') {
    const refToCheck =
      item?.jsonData?.spec?.chartRef ?? item?.jsonData?.spec?.chart?.spec?.sourceRef;
    if (refToCheck) {
      pluralKind = PluralName(refToCheck.kind);
      name = refToCheck.name;
      namespace = refToCheck.namespace;
    }
  } else {
    pluralKind = PluralName(itemKind);
    name = item.metadata.name;
  }

  return { name, pluralKind, namespace };
}

export function ObjectEvents(props: { events: any }) {
  const { events } = props;
  if (!events) {
    return null;
  }
  return (
    <SectionBox title={'Events'}>
      <Table
        // @ts-ignore -- TODO Update the sorting param
        defaultSortingColumn={4}
        columns={[
          {
            header: 'Type',
            accessorFn: item => {
              return item.type;
            },
          },
          {
            header: 'Reason',
            accessorFn: item => {
              return item.reason;
            },
          },
          {
            header: 'From',
            accessorFn: item => {
              return item.source.component;
            },
          },
          {
            header: 'Message',
            accessorFn: item => {
              return (
                item && (
                  <ShowHideLabel labelId={`${item?.metadata?.uid}-message`}>
                    {item.message ?? ''}
                  </ShowHideLabel>
                )
              );
            },
          },
          {
            id: 'age',
            header: 'Age',
            accessorFn: item => {
              if (item.count > 1) {
                return `${timeAgo(item.lastOccurrence)} (${item.count} times over ${timeAgo(
                  item.firstOccurrence
                )})`;
              }
              const eventDate = timeAgo(item.lastOccurrence, { format: 'mini' });
              let label: string;
              if (item.count > 1) {
                label = `${eventDate} ${item.count} times since ${timeAgo(item.firstOccurrence)}`;
              } else {
                label = eventDate;
              }

              return (
                <HoverInfoLabel
                  label={label}
                  hoverInfo={localeDate(item.lastOccurrence)}
                  icon="mdi:calendar"
                />
              );
            },
            gridTemplate: 'min-content',
            enableColumnFilter: false,
            muiTableBodyCellProps: {
              align: 'right',
            },
          },
        ]}
        data={events}
        initialState={{
          sorting: [
            {
              id: 'age',
              desc: false,
            },
          ],
        }}
      />
    </SectionBox>
  );
}

export function parseDuration(duration) {
  const regex = /(\d+)([hms])/g; // Match numbers followed by h, m, or s
  let totalMilliseconds = 0;
  let match;

  while ((match = regex.exec(duration)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'h':
        totalMilliseconds += value * 60 * 60 * 1000; // Convert hours to milliseconds
        break;
      case 'm':
        totalMilliseconds += value * 60 * 1000; // Convert minutes to milliseconds
        break;
      case 's':
        totalMilliseconds += value * 1000; // Convert seconds to milliseconds
        break;
    }
  }

  return totalMilliseconds;
}

export function NameLink(resourceClass: KubeObjectClass) {
  const apiVersion = new String(resourceClass.apiVersion); // explicit String cast is needed for string methods
  const slashIndex = apiVersion.lastIndexOf('/');
  const groupName = slashIndex > 0 ? apiVersion.substring(0, slashIndex) : apiVersion;
  const pluralName = PluralName(resourceClass.kind);

  return {
    header: 'Name',
    accessorKey: 'metadata.name',
    Cell: ({ cell, row }) => (
      <Link
        routeName={groupName.substring(0, groupName.indexOf('.'))}
        params={{
          name: row.original.jsonData.metadata.name,
          namespace: row.original.jsonData.metadata.namespace,
          pluralName: pluralName,
        }}
      >
        {cell.getValue()}
      </Link>
    ),
  };
}
